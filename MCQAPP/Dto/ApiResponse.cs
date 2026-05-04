namespace MCQAPP.Dto
{
    public class ApiResponse<T>
    {
        public int StatusCode { get; set; }
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = "";
        public T? Data { get; set; }
        public List<string>? Errors { get; set; }

        public static ApiResponse<T> Success(T data, string message = "", int statusCode = 200)
            => new() {StatusCode = statusCode, IsSuccess = true, Data = data, Message = message };

        public static ApiResponse<T> Fail(string message, List<string>? errors = null, int statusCode = 500)
            => new() {StatusCode = statusCode, IsSuccess = false, Message = message, Errors = errors };

        public static ApiResponse<T> GenericResponse(T data, string message = "", int statusCode = 200, bool isSucess = true)
            => new() { StatusCode = statusCode, IsSuccess = isSucess, Data = data, Message = message };
    }
}