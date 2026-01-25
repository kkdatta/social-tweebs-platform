export interface CurrentUserPayload {
    sub: string;
    email: string;
    role: string;
}
export declare const CurrentUser: (...dataOrPipes: ("id" | keyof CurrentUserPayload | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
