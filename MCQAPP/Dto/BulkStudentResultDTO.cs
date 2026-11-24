using System.Collections.Generic;

namespace MCQAPP.Dto
{
    public class BulkStudentResultDTO
    {
        public int TotalProcessed { get; set; }
        public int SuccessCount { get; set; }
        public int FailureCount { get; set; }
        public List<string> Errors { get; set; } = new();
    }
}
