namespace SelfMade.Api.Domain
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;

        public ICollection<UserInterest> Interests { get; set; } = new List<UserInterest>();
    }
}
