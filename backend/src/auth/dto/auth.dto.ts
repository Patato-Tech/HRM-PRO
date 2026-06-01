import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @IsString()
    companyId?: string;

    @IsOptional()
    @IsString()
    actorRole?: string;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;

    @IsOptional()
    @IsString()
    companyId?: string;

    @IsOptional()
    @IsString()
    role?: string;
}
