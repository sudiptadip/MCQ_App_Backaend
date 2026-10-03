export default interface apiResponse<T> {
    statusCode: number,
    isSuccess: boolean,
    message?: string,
    data?: T,
    errors?: string[]
}