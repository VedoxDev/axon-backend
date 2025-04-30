import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "src/users/user.entity";

export const GetUser = createParamDecorator(
    (data: keyof User, ctx: ExecutionContext): any => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as User;

        return data ? user?.[data] : user;
    }
)
