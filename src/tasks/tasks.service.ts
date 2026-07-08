import { Injectable } from '@nestjs/common';
import { ProcessTaskDto } from './dto/process-task.dto';
import { RmqContext } from '@nestjs/microservices';
import { spawn } from 'child_process';

@Injectable()
export class TasksService {
  async processTask(processTaskDto: ProcessTaskDto, ctx: RmqContext) {
    console.log('Iniciando tarefa:', processTaskDto);

    const [command, ...args] = processTaskDto.arguments;
    const exitCode = await this.runCommand(command, args);

    if (exitCode === 0) {
      ctx.getChannelRef().ack(ctx.getMessage());
      console.log(`Tarefa ${processTaskDto.taskId} concluída`);
    } else {
      ctx.getChannelRef().nack(ctx.getMessage(), false, true);
      console.error(`Tarefa ${processTaskDto.taskId} falhou com código ${exitCode}`);
    }
  }

  private runCommand(command: string, args: string[]): Promise<number> {
    return new Promise((resolve) => {
      const child = spawn(command, args, { stdio: 'inherit' });

      child.on('close', (code) => resolve(code ?? 1));
      child.on('error', () => resolve(1));
    });
  }
}
