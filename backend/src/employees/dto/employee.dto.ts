import { IsEmail, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateEmployeeDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    password: string;

    @IsOptional()
    @IsString()
    designation?: string;

    @IsOptional()
    @IsString()
    departmentId?: string;

    @IsOptional()
    @IsNumber()
    salary?: number;

    @IsOptional()
    @IsString()
    role?: string;
    roleId?: number;
}

export class UpdateEmployeeDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    designation?: string;

    @IsOptional()
    @IsString()
    departmentId?: string;

    @IsOptional()
    @IsNumber()
    salary?: number;

    @IsOptional()
    @IsString()
    status?: string;
    @IsOptional()
    roleId?: number;
}
