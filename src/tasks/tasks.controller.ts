import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { TasksService } from './tasks.service';
import { ProcessTaskDto } from './dto/process-task.dto';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @EventPattern()
  processTask(@Payload() processTaskDto: ProcessTaskDto, @Ctx() ctx: RmqContext) {
    return this.tasksService.processTask(processTaskDto, ctx);
  }

}
