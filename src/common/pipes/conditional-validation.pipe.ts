// conditional-validation.pipe.ts
import { ArgumentMetadata, Injectable, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SKIP_GLOBAL_VALIDATION } from '../decorators/skip-validation.decorator';

@Injectable()
export class ConditionalValidationPipe extends ValidationPipe {
  constructor(private readonly reflector: Reflector) {
    super({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    });
  }

  override async transform(value: any, metadata: ArgumentMetadata) {
    // Si no hay tipo de información no es posible validar
    if (!metadata.metatype) {
      return value;
    }

    // Verifica si la validacion deberia ser saltada para este tipo.
    const skip = this.reflector.get(SKIP_GLOBAL_VALIDATION, metadata.metatype);
    if (skip) {
      return value;
    }

    // Realiza validacion para todos los tipos de parametro
    return super.transform(value, metadata);
  }
}
