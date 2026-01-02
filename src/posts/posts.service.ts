import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../categories/category.entity';
import { User } from '../users/entities/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Comment } from './entities/comment.entity';
import { PostAttachment } from './entities/post-attachment.entity';
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

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(PostAttachment)
    private attachmentRepository: Repository<PostAttachment>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async findAll(
    page = 1,
    limit = 10,
    filters?: PostFilters,
    sort?: string,
  ): Promise<PaginatedResponse<Post>> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.attachments', 'attachments')
      .skip(skip)
      .take(limit);

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
        queryBuilder.orderBy('post.createdAt', 'DESC');
    }

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
      relations: ['author', 'attachments'],
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
    const { categoryId, attachments, ...rest } = createPostDto;
    let category: Category | null = null;
    if (categoryId) {
      category = await this.categoryRepo.findOneBy({ id: +categoryId });
    }

    const attachmentEntities = attachments?.map((att) =>
      this.attachmentRepository.create({ name: att.name, url: att.url }),
    );

    const post = this.postsRepository.create({
      ...rest,
      attachments: attachmentEntities,
      gallery: createPostDto.gallery?.join(','),
      author,
      category,
    });
    return this.postsRepository.save(post);
  }

  async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);
    const {
      categoryId,
      attachments,
      gallery,
      existingGallery,
      existingAttachmentIds,
      ...rest
    } = updatePostDto;

    Object.assign(post, rest);

    // مدیریت attachments
    if (attachments || existingAttachmentIds !== undefined) {
      // دریافت attachments موجود
      const currentAttachments = post.attachments || [];

      // حذف attachments که در existingAttachmentIds نیستند
      if (existingAttachmentIds !== undefined) {
        // حذف attachments که کاربر حذف کرده
        for (const att of currentAttachments) {
          if (!existingAttachmentIds.includes(String(att.id))) {
            await this.attachmentRepository.delete(att.id);
          }
        }
      }

      // اضافه کردن attachments جدید
      if (attachments && attachments.length > 0) {
        const newAttachments = attachments.map((att) =>
          this.attachmentRepository.create({
            name: att.name,
            url: att.url,
            postId: post.id,
          }),
        );
        await this.attachmentRepository.save(newAttachments);
      }
    }

    // مدیریت gallery
    if (gallery || existingGallery !== undefined) {
      // گالری موجود
      const currentGallery = post.gallery ? post.gallery.split(',') : [];

      // عکس‌هایی که باید نگه داشته شوند
      const keptGallery = existingGallery || [];

      // اضافه کردن عکس‌های جدید
      const newGallery = gallery || [];

      // ترکیب عکس‌های موجود که حذف نشدند با عکس‌های جدید
      const finalGallery = [...keptGallery, ...newGallery];

      post.gallery =
        finalGallery.length > 0 ? finalGallery.join(',') : undefined;
    }

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
