import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateAttendanceDto {
    @IsString()
    employeeId: string;

    @IsDateString()
    date: string;

    @IsOptional()
    @IsDateString()
    checkIn?: string;

    @IsOptional()
    @IsDateString()
    checkOut?: string;

    @IsString()
    status: string;
}

export class UpdateAttendanceDto {
    @IsOptional()
    @IsDateString()
    checkIn?: string;

    @IsOptional()
    @IsDateString()
    checkOut?: string;

    @IsOptional()
    @IsString()
    status?: string;
}
