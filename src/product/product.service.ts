import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client'; // ✅ Shu joy muhim
import { CreateProductDto } from './dto/create-product.dto';
import { QueryDto } from './dto/query';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    return await this.prisma.product.create({
      data: {
        ...createProductDto,
        price: new Prisma.Decimal(createProductDto.price), // ✅ endi xato yo‘q
      },
    });
  }
  async findAll(query: QueryDto) {
    const {
      search,
      page = 1,
      limit = 10,
      categoryId,
      minPrice,
      maxPrice,
    } = query;
    const pageNumber = Math.max(1, page);
    const pageSize = Math.max(1, limit);
    const skip = (pageNumber - 1) * pageSize;

    const where: Prisma.ProductWhereInput = {
      ...(search && {
        OR: [
          { name_uz: { contains: search, mode: 'insensitive' } },
          { name_en: { contains: search, mode: 'insensitive' } },
          { name_ru: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(minPrice || maxPrice
        ? {
            price: {
              ...(minPrice ? { gte: minPrice } : {}),
              ...(maxPrice ? { lte: maxPrice } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      total,
      page: pageNumber,
      limit: pageSize,
      pages: Math.ceil(total / pageSize),
      items,
    };
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { Category: true },
    });
  }

  async update(id: string, updateProductDto: Partial<CreateProductDto>) {
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }
}
