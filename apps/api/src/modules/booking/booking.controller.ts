import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@ApiTags('Booking')
@Controller('booking')
export class BookingController {
  constructor(private bookingService: BookingService) {}

  @Get(':slug')
  getClinicInfo(@Param('slug') slug: string) {
    return this.bookingService.getClinicInfo(slug);
  }

  @Get(':slug/veterinarians')
  getVeterinarians(@Param('slug') slug: string) {
    return this.bookingService.getVeterinarians(slug);
  }

  @Get(':slug/slots')
  getAvailableSlots(
    @Param('slug') slug: string,
    @Query('date') date: string,
    @Query('veterinarianId') veterinarianId: string,
  ) {
    return this.bookingService.getAvailableSlots(slug, date, veterinarianId);
  }

  @Post(':slug/book')
  createBooking(
    @Param('slug') slug: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingService.createBooking(slug, dto);
  }
}
