import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";

interface ValidateBodyOptions {
    requiredFields: string[];
    dto : new () => any;
}

@Injectable()
export class ValidateBodyPipe implements PipeTransform {
    constructor(
        private readonly options: ValidateBodyOptions,
    ) {}
    
    transform(value: any, metadata: ArgumentMetadata) {
        const { 
            requiredFields,
            dto,
        } = this.options;

        // Check all required fields and collect missing ones
        const missingFields = requiredFields.filter(field => value[field] === undefined);
        
        if (missingFields.length > 0) {
            throw new BadRequestException(
                missingFields.map(field => `${field}-required`)
            );
        }

        const dtoInstance = plainToInstance(dto, value);
        const errors = validateSync(dtoInstance, { 
            whitelist: true, 
            forbidNonWhitelisted: true
        }); 
        
        if (errors.length > 0) {
            throw new BadRequestException(errors.flatMap(e => Object.values(e.constraints ?? {})));
        }

        return dtoInstance;
    }
}

