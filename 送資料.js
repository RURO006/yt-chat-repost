// intervalId
var intervalId;

// map
var liveChatItemMap = {};
var liveChatTickerMap = {};

// 傳遞物件
var liveChatItemList = [];
var liveChatTickerList = [];

// 會員訊息
var liveChatItemRender = document
    .querySelector('.ytd-live-chat-frame')
    .contentDocument.querySelector('#items.style-scope.yt-live-chat-item-list-renderer');
// 會員Ticker
var liveChatTickerRender = document
    .querySelector('.ytd-live-chat-frame')
    .contentDocument.querySelector('#items.style-scope.yt-live-chat-ticker-renderer');

// 顯示log
function myLog() {
    // 需要再解開註解
    console.log(...arguments);
}

function HttpRequest(method, url, data, async = true) {
    return new Promise((resolve, reject) => {
        const xmlhttp = new XMLHttpRequest();
        // 物件轉字串
        if (typeof data === 'object') {
            data = JSON.stringify(data);
        }
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4) {
                let result;
                if (xmlhttp.responseText?.length > 0) {
                    result = JSON.parse(xmlhttp.responseText);
                }
                if (xmlhttp.status >= 200 && xmlhttp.status < 300) {
                    resolve(result);
                } else {
                    reject({ code: xmlhttp.status, result });
                }
            }
        };
        xmlhttp.open(method, url, async);
        // POST的格式為JSON
        if (method.toUpperCase() === 'POST') {
            xmlhttp.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
        }
        xmlhttp.send(data);
    });
}

// setInterval(() => {
//     csvContent = document.querySelector('.ytd-live-chat-frame').contentDocument.querySelector('#contents').innerHTML;
//     HttpRequest('POST', 'http://localhost:15760/api/UpdateChat', { htmlData: csvContent })
//         .then((data) => {
//             myLog('ok', data);
//         })
//         .catch((data) => {
//             myLog('error', data);
//         });
// }, 1500);

function sendMsg(liveChatItemList = [], liveChatTickerList = []) {
    if (liveChatItemList.length == 0 && liveChatTickerList.length == 0) {
        return;
    }
    // 顯示刪除的
    let deleteItemList = liveChatItemList.filter((o) => o.status == -1);
    let deleteTickerIdList = liveChatTickerList.filter((o) => o.status == -1);

    return HttpRequest('POST', 'http://localhost:15760/api/UpdateChat', {
        liveChatItemList,
        liveChatTickerList,
    })
        .then((data) => {
            myLog('ok', data);
            return {
                deleteItemIdList: deleteItemList.map((o) => o.id),
                deleteTickerIdList: deleteTickerIdList.map((o) => o.id),
            };
        })
        .catch((data) => {
            myLog('error', data);
        });
}

//
class Msg {
    constructor(id, dom) {
        this.id = id;
        this.dom = dom;
        this.textContent = dom.textContent;
        this.status = 2;
    }
    needUpdate(newDom) {
        if (newDom) {
            if (this.textContent !== newDom.textContent) {
                myLog('old', this.textContent);
                myLog('new', newDom.textContent);
                this.textContent = newDom.textContent;
                this.dom = newDom;
                // 要更新
                return (this.status = 1);
            } else {
                // 不變
                return (this.status = 0);
            }
        } else {
            // 要刪除
            return (this.status = -1);
        }
    }
    needDelete() {
        let item = document
            .querySelector('.ytd-live-chat-frame')
            .contentDocument.querySelector(`#items.style-scope.yt-live-chat-item-list-renderer [id='${this.id}']`);
        if (!item) {
            this.status = -1;
            return true;
        }
        return false;
    }
}
class Ticker {
    constructor(id, dom) {
        this.id = id;
        this.dom = dom;
        this.textContent = dom.textContent;
        this.status = 2;
    }
    needUpdate(newDom) {
        if (newDom) {
            if (this.textContent !== newDom.textContent) {
                myLog('old', this.textContent);
                myLog('new', newDom.textContent);
                this.textContent = newDom.textContent;
                this.dom = newDom;
                // 要更新
                return (this.status = 1);
            } else {
                // 不變
                return (this.status = 0);
            }
        } else {
            // 要刪除
            return (this.status = -1);
        }
    }
    needDelete() {
        let item = document
            .querySelector('.ytd-live-chat-frame')
            .contentDocument.querySelector(`#items.style-scope.yt-live-chat-ticker-renderer [id='${this.id}']`);
        if (!item) {
            this.status = -1;
            return true;
        }
        return false;
    }
}

function Clear() {
    return HttpRequest('DELETE', 'http://localhost:15760/api/UpdateChat')
        .then((data) => {
            myLog('clear ok', data);
            // 會員訊息
            liveChatItemRender = document
                .querySelector('.ytd-live-chat-frame')
                .contentDocument.querySelector('#items.style-scope.yt-live-chat-item-list-renderer');
            // 會員Ticker
            liveChatTickerRender = document
                .querySelector('.ytd-live-chat-frame')
                .contentDocument.querySelector('#items.style-scope.yt-live-chat-ticker-renderer');

            liveChatItemMap = {};
            liveChatTickerMap = {};

            liveChatItemList = [];
            liveChatTickerList = [];
            return;
        })
        .catch((data) => {
            myLog('clear error', data);
        });
}

/**
 *  開始傳送資料
 */
function Stop() {
    clearInterval(intervalId);
}

/**
 * 開始傳送資料
 * @param sleep_ms 間隔時間(毫秒)
 */
function Start(sleep_ms = 500) {
    Stop();
    intervalId = setInterval(() => {
        //#region Chat Item
        for (let i = 0; i < liveChatItemRender.children.length; i++) {
            let item = liveChatItemRender.children[i];
            let key = item.id;
            if (!(key in liveChatItemMap)) {
                liveChatItemMap[key] = new Msg(key, item);
                liveChatItemList.push(liveChatItemMap[key]);
            } else {
                liveChatItemMap[key].needUpdate(item);
            }
        }
        // yt有一個留言數最大數250，maxMsgCount一定要大於等於該數字
        // 否則"檢查是否刪除"的部分會太過於消耗效能
        var maxMsgCount = 250;
        if (liveChatItemList.length > maxMsgCount) {
            let needDeleteCount = liveChatItemList.length - maxMsgCount;
            for (let item of liveChatItemList) {
                if (item.needDelete()) {
                    needDeleteCount--;
                }
                if (needDeleteCount <= 0) {
                    break;
                }
            }
        }

        // 顯示新增、更新、刪除的項目
        let ci = liveChatItemList.filter((o) => o.status == 2).map((item) => item.status);
        let cu = liveChatItemList.filter((o) => o.status == 1).map((item) => item.status);
        let cd = liveChatItemList.filter((item) => item.status == -1).map((item) => item.status);
        if (ci.length > 0) {
            myLog('c_insert', ci);
        }
        if (cu.length > 0) {
            myLog('c_update', cu);
        }
        if (cd.length > 0) {
            myLog('c_delete', cd);
        }

        //#endregion

        //#region Chat Ticker
        for (let i = 0; i < liveChatTickerRender.children.length; i++) {
            let item = liveChatTickerRender.children[i];
            let key = item.id;
            // style.width === '0px'，代表yt還沒準備好，先略過
            if (item.style.width === '0px') {
                continue;
            }
            if (!(key in liveChatTickerMap)) {
                liveChatTickerMap[key] = new Ticker(key, item);
                liveChatTickerList.push(liveChatTickerMap[key]);
            } else {
                liveChatTickerMap[key].needUpdate(item);
            }
        }
        // 超過maxTickerCount後，開始檢查是否刪除
        var maxTickerCount = 0;

        if (liveChatTickerList.length > maxTickerCount) {
            let needDeleteCount = liveChatTickerList.length - maxTickerCount;
            for (let item of liveChatTickerList) {
                if (item.needDelete()) {
                    needDeleteCount--;
                }
                if (needDeleteCount <= 0) {
                    break;
                }
            }
        }

        // 顯示新增、更新、刪除的項目
        let ti = liveChatTickerList.filter((o) => o.status == 2).map((item) => item.id);
        let tu = liveChatTickerList.filter((o) => o.status == 1).map((item) => item.status);
        let td = liveChatTickerList.filter((item) => item.status == -1).map((item) => item.status);
        if (ti.length > 0) {
            myLog('t_insert', ti);
        }
        if (tu.length > 0) {
            myLog('t_update', tu);
        }
        if (td.length > 0) {
            myLog('t_delete', td);
        }

        //#endregion
        //#region 傳送資料

        // 送出狀態為"新增"、"更新"、"刪除"的資料
        let result = sendMsg(
            liveChatItemList
                .filter((o) => o.status != 0)
                .map((o) => {
                    return {
                        status: o.status,
                        id: o.id,
                        outerHtml: o.dom.outerHTML,
                    };
                }),
            liveChatTickerList
                .filter((o) => o.status != 0)
                .map((o) => {
                    return {
                        status: o.status,
                        id: o.id,
                        outerHtml: o.dom.outerHTML,
                    };
                })
        );
        result?.then(({ deleteItemIdList, deleteTickerIdList }) => {
            //
            for (let i = 0; i < liveChatItemList.length; i++) {
                let item = liveChatItemList[i];
                for (let j = 0; j < deleteItemIdList.length; j++) {
                    let id = deleteItemIdList[j];
                    if (item.id === id) {
                        liveChatItemList.splice(i--, 1);
                        deleteItemIdList.splice(j--, 1);
                        delete liveChatItemMap[id];
                    }
                }
            }

            for (let i = 0; i < liveChatTickerList.length; i++) {
                let item = liveChatTickerList[i];
                for (let j = 0; j < deleteTickerIdList.length; j++) {
                    let id = deleteTickerIdList[j];
                    if (item.id === id) {
                        liveChatTickerList.splice(i--, 1);
                        deleteTickerIdList.splice(j--, 1);
                        delete liveChatTickerMap[id];
                    }
                }
            }
        });
        //#endregion
    }, sleep_ms);
}

// // 下載檔案
// // const link = document.createElement('a');
// csvContent = document.querySelector('.ytd-live-chat-frame').contentDocument.querySelector('#contents').innerHTML;
// link = document.createElement('a');
// csvData = new Blob([csvContent], {
//     type: 'text/plain',
// });
// csvUrl = URL.createObjectURL(csvData);
// link.setAttribute('href', csvUrl);
// link.setAttribute('download', `temp.txt`);
// document.body.appendChild(link); // Required for FF
// link.click();
// document.body.removeChild(link);

btn = document.createElement('button');
btn.style = 'position: fixed; right: 0; background-color: aqua; z-index: 999999;';
btn.innerText = 'Stop';
btn.addEventListener('click', () => {
    Stop();
});
document.body.appendChild(btn);

btn = document.createElement('button');
btn.style = 'position: fixed; right: 0; top: 30px; background-color: aqua; z-index: 999999;';
btn.innerText = 'Start';
btn.addEventListener('click', () => {
    Start(500);
});
document.body.appendChild(btn);

btn = document.createElement('button');
btn.style = 'position: fixed; right: 0; top: 60px; background-color: aqua; z-index: 999999;';
btn.innerText = 'Clear';
btn.addEventListener('click', () => {
    Clear();
});
document.body.appendChild(btn);
