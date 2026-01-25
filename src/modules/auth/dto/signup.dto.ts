import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  Matches,
  IsBoolean,
  Equals,
} from 'class-validator';
import { CampaignFrequency } from '../../../common/enums';

export class SignupDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @ApiProperty({ example: 'john@business.com', description: 'Business email' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: '1234567890', description: 'Phone number' })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^[0-9]{10,15}$/, { message: 'Please provide a valid phone number' })
  phoneNumber: string;

  @ApiProperty({ example: 'Acme Corp', description: 'Business name' })
  @IsString()
  @IsNotEmpty({ message: 'Business name is required' })
  businessName: string;

  @ApiProperty({
    enum: CampaignFrequency,
    example: CampaignFrequency.MEDIUM,
    description: 'Campaign frequency',
  })
  @IsEnum(CampaignFrequency, { message: 'Please select a valid campaign frequency' })
  @IsNotEmpty({ message: 'Campaign frequency is required' })
  campaignFrequency: CampaignFrequency;

  @ApiProperty({ example: 'Looking forward to using the platform', required: false })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Password' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Confirm password' })
  @IsString()
  @IsNotEmpty({ message: 'Confirm password is required' })
  confirmPassword: string;

  @ApiProperty({ example: 'abc123xyz', description: 'Captcha response token' })
  @IsString()
  @IsNotEmpty({ message: 'Captcha verification is required' })
  captchaToken: string;

  @ApiProperty({ example: true, description: 'Accept Terms & Conditions' })
  @IsBoolean({ message: 'You must accept the Terms & Conditions' })
  @Equals(true, { message: 'You must accept the Terms & Conditions' })
  agreeToTerms: boolean;
}

export class SignupResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;
}
