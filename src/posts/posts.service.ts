import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../categories/category.entity';
import { User } from '../users/entities/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Comment } from './entities/comment.entity';
import { Post, PostSection } from './entities/post.entity';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface PostFilters {
  section?: PostSection;
  title?: string;
  tags?: string[];
  categoryId?: number;
}

export type PostWithAttachments = Omit<Post, 'attachments'> & {
  attachments: string[];
};

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async findAll(
    page = 1,
    limit = 10,
    filters?: PostFilters,
    sort?: string,
  ): Promise<PaginatedResponse<PostWithAttachments>> {
    const skip = (page - 1) * limit;

    // Build query with filters
    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .skip(skip)
      .take(limit);

    // Apply sorting
    switch (sort) {
      case 'newest':
        queryBuilder.orderBy('post.createdAt', 'DESC');
        break;
      case 'oldest':
        queryBuilder.orderBy('post.createdAt', 'ASC');
        break;
      case 'most_viewed':
        queryBuilder.orderBy('post.views', 'DESC');
        break;
      default:
        queryBuilder.orderBy('post.createdAt', 'DESC'); // Default sort by newest
    }

    // Apply filters if provided
    if (filters) {
      if (filters.section) {
        queryBuilder.andWhere('post.section = :section', {
          section: filters.section,
        });
      }

      if (filters.title) {
        queryBuilder.andWhere('post.title LIKE :title', {
          title: `%${filters.title}%`,
        });
      }

      if (filters.tags && filters.tags.length > 0) {
        // Filter posts that have at least one of the specified tags
        queryBuilder.andWhere('post.tags && :tags', {
          tags: filters.tags,
        });
      }

      if (filters.categoryId) {
        queryBuilder.andWhere('post.categoryId = :categoryId', {
          categoryId: filters.categoryId,
        });
      }
    }

    // Execute query and count
    const [posts, totalItems] = await queryBuilder.getManyAndCount();

    return {
      data: posts.map((post) => {
        return {
          ...post,
          attachments: post.attachments?.split(',') || [],
        };
      }),
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async incrementViews(id: string): Promise<Post> {
    const post = await this.findOne(id);
    post.views += 1;
    return this.postsRepository.save(post);
  }

  async create(createPostDto: CreatePostDto, author: User): Promise<Post> {
    const { categoryId, ...rest } = createPostDto;
    let category: Category | null = null;
    if (categoryId) {
      category = await this.categoryRepo.findOneBy({ id: +categoryId });
    }
    const post = this.postsRepository.create({
      ...rest,
      attachments: createPostDto.attachments?.join(','),
      author,
      category,
    });
    return this.postsRepository.save(post);
  }

  async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);
    const { categoryId, ...rest } = updatePostDto;
    Object.assign(post, rest);
    if (categoryId !== undefined) {
      post.categoryId = categoryId
        ? (await this.categoryRepo.findOneBy({ id: +categoryId }))?.id
        : undefined;
    }
    return this.postsRepository.save(post);
  }

  async remove(id: string): Promise<void> {
    const result = await this.postsRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
  }

  async addComment(
    id: string,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const post = await this.findOne(id);

    // Create and save the comment
    const comment = this.commentsRepository.create({
      ...createCommentDto,
      post,
    });

    await this.commentsRepository.save(comment);

    // Update the post's average rating
    await this.updatePostRating(post.id);

    return comment;
  }

  async getComments(id: string): Promise<Comment[]> {
    const post = await this.findOne(id);
    return post.comments || [];
  }

  private async updatePostRating(postId: string): Promise<void> {
    const post = await this.findOne(postId);

    if (!post.comments || post.comments.length === 0) {
      post.averageRating = 0;
      post.totalRatings = 0;
    } else {
      // Calculate the average rating
      const sum = post.comments.reduce(
        (acc, comment) => acc + comment.rating,
        0,
      );
      post.averageRating = sum / post.comments.length;
      post.totalRatings = post.comments.length;
    }

    await this.postsRepository.save(post);
  }
}
