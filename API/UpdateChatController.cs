using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using mvc15760.Models;
using SignalRChat.Hubs;

namespace mvc15760.API
{
    [Route("api/[controller]")]
    [ApiController]
    public class UpdateChatController : ControllerBase
    {
        // ChatHub chatHub;
        private readonly IHubContext<ChatHub> chatHub;
        public UpdateChatController(IHubContext<ChatHub> chatHub)
        {
            this.chatHub = chatHub;
        }
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            await chatHub.Clients.All.SendAsync("ReceiveMessage", "AAA", "BBB");
            return Ok();
        }
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] MessageData data)
        {
            if (data != null)
            {
                System.Console.WriteLine($"liveChatItemList:{data.liveChatItemList?.Count}，liveChatTickerList:{data.liveChatTickerList?.Count}");
                // 廣播
                await chatHub.Clients.All.SendAsync("ReceiveMessage", "htmlData", data);
            }
            return Ok();
        }

        [HttpDelete]
        public async Task<IActionResult> Delete()
        {
            await chatHub.Clients.All.SendAsync("ReceiveMessage", "delete", "");
            return Ok();
        }
    }
}