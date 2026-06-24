const fs = require('fs');
const file = "C:/Users/aghaa/Desktop/HRM PRO/backend/src/platform/dto/platform.dto.ts";
const lines = fs.readFileSync(file, 'utf8').split('\n');
const bottom = lines.slice(54).join('\n');
const newContent = import { IsEmail, IsOptional, IsString } from 'class-validator';
export class PlatformLoginDto {
    @IsEmail()
    email: string;
    @IsString()
    password: string;
}
export class CreateCompanyDto {
    @IsString()
    companyName: string;
    @IsOptional() @IsString() industry?: string;
    @IsOptional() @IsString() address?: string;
    @IsOptional() @IsString() city?: string;
    @IsOptional() @IsString() country?: string;
    @IsOptional() @IsString() companyPhone?: string;
    @IsOptional() @IsString() website?: string;
    @IsOptional() @IsString() companySize?: string;
    @IsOptional() @IsString() regNumber?: string;
    @IsOptional() @IsString() planId?: string;
    @IsString() adminName: string;
    @IsEmail() adminEmail: string;
    @IsString() adminPassword: string;
}
 + bottom;
fs.writeFileSync(file, newContent, 'utf8');
console.log('Done!');