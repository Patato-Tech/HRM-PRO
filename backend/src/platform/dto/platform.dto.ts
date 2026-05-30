import { IsEmail, IsOptional, IsString } from 'class-validator';

export class PlatformLoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

export class CreateCompanyDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    industry?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    planId?: string;

    @IsString()
    adminName: string;

    @IsEmail()
    adminEmail: string;

    @IsString()
    adminPassword: string;
}

export class UpdateCompanyDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    industry?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    planId?: string;
}

export class TransferEmployeeDto {
    @IsString()
    employeeId: string;

    @IsString()
    toCompanyId: string;
}
