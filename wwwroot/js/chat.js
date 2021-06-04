'use strict';
var connection = new signalR.HubConnectionBuilder().withUrl('/chatHub').build();
var tmpDiv = document.createElement('div');
var chatListRenderer, liveChatTickerRender;
document.addEventListener('DOMContentLoaded', () => {
    chatListRenderer = document.querySelector('#items.style-scope.yt-live-chat-item-list-renderer');
    liveChatTickerRender = document.querySelector('#items.style-scope.yt-live-chat-ticker-renderer');
});

function getDomByHtmlText(outerHTML) {
    tmpDiv.innerHTML = outerHTML;
    let newDom = tmpDiv.children[0];
    tmpDiv.removeChild(newDom);
    return newDom;
}

/**
 * 滾到最底部
 */
function scrollToBottom() {
    let itemScroller = document.querySelector('html');
    itemScroller.scrollTo({
        top: itemScroller.scrollHeight,
        // behavior: 'smooth',
    });
}

/**
 * ChatItemListRenderer滾到最底部
 */
function itemListRendererScrollToBottom() {
    let itemScroller = document.querySelector('#items.style-scope.yt-live-chat-item-list-renderer');
    itemScroller.scrollTo({
        top: itemScroller.scrollHeight,
        // behavior: 'smooth',
    });
}

connection.on('ReceiveMessage', function (title, data) {
    try {
        // console.log('ReceiveMessage', title);
        if (title == 'delete') {
            chatListRenderer.innerHTML = '';
            liveChatTickerRender.innerHTML = '';
        }
        if (!data.liveChatTickerList) {
            console.warn('data.liveChatTickerList沒有值');
        }
        // liveChatTickerList越前面越新，所以要reverse反過來插入，並且要插在第一個
        data.liveChatTickerList?.reverse().forEach((tickerItem) => {
            // 新增
            if (tickerItem.status == 2) {
                // console.log('新增', tickerItem);
                let newDom = getDomByHtmlText(tickerItem.outerHtml);
                // 插在第一個insertAdjacentElement('afterbegin')
                liveChatTickerRender.insertAdjacentElement('afterbegin', newDom);
            }
            // 更新
            else if (tickerItem.status == 1) {
                // console.log('更新', tickerItem);
                for (let i = 0; i < liveChatTickerRender.children.length; i++) {
                    let oldDom = liveChatTickerRender.children[i];
                    if (tickerItem.id == oldDom.id) {
                        let newDom = getDomByHtmlText(tickerItem.outerHtml);
                        oldDom.insertAdjacentElement('afterend', newDom);
                        liveChatTickerRender.removeChild(oldDom);
                        break;
                    }
                }
            }
            // 刪除
            else if (tickerItem.status == -1) {
                // console.log('刪除', tickerItem);
                for (var i = 0; i < liveChatTickerRender.children.length; i++) {
                    let oldDom = liveChatTickerRender.children[i];
                    if (tickerItem.id == oldDom.id) {
                        liveChatTickerRender.removeChild(oldDom);
                        break;
                    }
                }
            }
        });

        if (!data.liveChatItemList) {
            console.warn('data.liveChatItemList沒有值');
        }
        data.liveChatItemList?.forEach((chatItem) => {
            // 新增
            if (chatItem.status == 2) {
                // console.log('新增', chatItem);
                let newDom = getDomByHtmlText(chatItem.outerHtml);
                chatListRenderer.appendChild(newDom);
                itemListRendererScrollToBottom();
            }
            // 更新
            else if (chatItem.status == 1) {
                // console.log('更新', chatItem);
                for (let i = 0; i < chatListRenderer.children.length; i++) {
                    let oldDom = chatListRenderer.children[i];
                    if (chatItem.id == oldDom.id) {
                        let newDom = getDomByHtmlText(chatItem.outerHtml);
                        oldDom.insertAdjacentElement('afterend', newDom);
                        chatListRenderer.removeChild(oldDom);
                        break;
                    }
                }
            }
            // 刪除
            else if (chatItem.status == -1) {
                // console.log('刪除', chatItem);
                for (var i = 0; i < chatListRenderer.children.length; i++) {
                    let oldDom = chatListRenderer.children[i];
                    if (chatItem.id == oldDom.id) {
                        chatListRenderer.removeChild(oldDom);
                        break;
                    }
                }
            }
        });
    } catch (e) {
        console.error(e);
    }
});

connection
    .start()
    .then(function () {
        console.log('Connneted');
    })
    .catch(function (err) {
        console.error(err.toString());
    });
