import { registerDecorator, ValidationOptions, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'requireOneField', async: false })
export class RequireOneFieldConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        const [fields] = args.constraints;
        const object = args.object as any;
        
        return fields.some((field: string) => {
            const value = object[field];
            return value !== undefined && value !== null && value !== '';
        });
    }

    defaultMessage(args: ValidationArguments) {
        const [fields] = args.constraints;
        return `${fields.join('-or-')}-required`;
    }
}

export function RequireOneField(fields: string[], validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [fields],
            validator: RequireOneFieldConstraint
        });
    };
} 