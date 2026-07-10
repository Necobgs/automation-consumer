import { Injectable } from '@nestjs/common';
import { ProcessTaskDto } from './dto/process-task.dto';
import { RmqContext } from '@nestjs/microservices';
import { spawn } from 'child_process';

@Injectable()
export class TasksService {
  async processTask(processTaskDto: ProcessTaskDto, ctx: RmqContext) {
    console.log('Iniciando tarefa:', processTaskDto);

    const [cmdUpdate, ...argsUpdate] =
      processTaskDto.cmdUpdateDependencies.split(" ");
    
    const exitCodeUpdate = 
      await this.runCommand(cmdUpdate, argsUpdate);

    if (exitCodeUpdate !== 0) {
      ctx.getChannelRef().nack(ctx.getMessage(), false, true);
      console.log(`Tarefa ${processTaskDto.taskId} não foi possível atualizar o projeto em ${processTaskDto.projectFolderPath}
        cmd update: ${processTaskDto.cmdUpdateDependencies}`);
      return;
    }

    const [cmdStart, ...argsStart] =
      processTaskDto.cmdStart.split(" ");

    const startExitCode = await this.runCommand(cmdStart, argsStart);


    if (startExitCode === 0) {
      ctx.getChannelRef().ack(ctx.getMessage());
      console.log(`Tarefa ${processTaskDto.taskId} concluída`);
      return;
    }

    ctx.getChannelRef().nack(ctx.getMessage(), false, true);
    console.error(`Tarefa ${processTaskDto.taskId} falhou`);    
  }

  private runCommand(command: string, args: string[]): Promise<number> {
    return new Promise((resolve) => {
      const child = spawn(command, args, { stdio: 'inherit' });
      
      child.on('close', (code) => resolve(code ?? 1));
      child.on('error', () => resolve(1));
    });
  }
}
