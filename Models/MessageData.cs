using System.Collections.Generic;

namespace mvc15760.Models
{
    public class MessageData
    {
        public List<LiveChatItem> liveChatItemList { get; set; }
        public List<LiveChatItem> liveChatTickerList { get; set; }
    }

    public class LiveChatItem
    {
        public ChatStatus status { get; set; }
        public string id { get; set; }
        public string outerHtml { get; set; }
    }

    public enum ChatStatus
    {
        Insert = 2,
        Update = 1,
        Unchange = 0,
        Delete = -1
    }
}