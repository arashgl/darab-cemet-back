import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostSection } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './entities/comment.entity';
import { User } from '../users/entities/user.entity';

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
}

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
  ) {}

  async findAll(
    page = 1,
    limit = 10,
    filters?: PostFilters,
  ): Promise<PaginatedResponse<Post>> {
    const skip = (page - 1) * limit;

    // Build query with filters
    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .skip(skip)
      .take(limit)
      .orderBy('post.createdAt', 'DESC');

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
    }

    // Execute query and count
    const [posts, totalItems] = await queryBuilder.getManyAndCount();

    return {
      data: posts,
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

  async create(createPostDto: CreatePostDto, author: User): Promise<Post> {
    const post = this.postsRepository.create({
      ...createPostDto,
      author,
    });

    return this.postsRepository.save(post);
  }

  async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);

    Object.assign(post, updatePostDto);

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
