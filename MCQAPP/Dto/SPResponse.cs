using Newtonsoft.Json.Linq;

namespace MCQAPP.Dto
{
    public class SPResponse
    {
        public int StatusCode { get; set; }
        public bool IsSuccess { get; set; }
        public JToken Response { get; set; }
        public string Message { get; set; }
    }
}