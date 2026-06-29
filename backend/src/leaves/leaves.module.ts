import { Module } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { LeavesController } from './leaves.controller';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [EmailModule],
    providers: [LeavesService],
    controllers: [LeavesController],
})
export class LeavesModule { }