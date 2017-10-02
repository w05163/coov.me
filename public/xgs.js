'use strict';
// 声明变量
let rtc;
const dom = {
	ok: j('#ok'),
	key: j('#key'),
	i: j('#input'),
	mediaList: j('#media-list'), // 视频列表
	msg: j('#msg'),
	send: j('#send'),
	body: j('body'),
	tmbox: j('#tmbox'),
	fab: j('#fab'),
	tm_card: j('#tmbox .card')
};
const media_list = [];// 视频div，不算自己


window.onload = function() {
	rtcInit();
	addEvent();
	const k = j.l('token_key');
	if (k) {
		dom.key.value = k;
	}
	tm.style = j.ls('tm_style') || {};
	if (typeof tm.style != 'object')tm.style = {};
	new dialog();
};
// 添加事件处理
function addEvent() {
	window.addEventListener('beforeunload', function() {
		event.returnValue = '确认离开此页吗？';
	});
	dom.ok.on('click', makeWss);
	dom.key.on('keyup', function() {
		if (event.keyCode == 13) {
			makeWss();
		}
	});
	dom.msg.on('keyup', inputingMsg);
	dom.fab.on('click', showTmbox);
	j('#send_file').on('click', sendFile);
	j('#send_img').on('click', sendFile);
	j('#close_connect').on('click', function() {
		closeConnect(true);
	});
}
function sendFile() {
	const f = document.createElement('input');
	f.type = 'file';
	if (this.id == 'send_img') {
		f.accept = '.jpg,.jpeg,.gif,.png';
	}
	f.click();
	f.addEventListener('change', function() {
		const fsize = (this.files[0].size / 1048576).toFixed(2);
		if (fsize > 50) {
			const fname = this.files[0].name;
			const that = this;
			const data = {
				title: '确认共享',
				content: fname + '大小' + (fsize) + 'M，已经大于50M；发送过大文件可能会照成视频卡顿，内存占用过大，如果电脑内存小甚至会卡死浏览器，是否继续发送？',
				n: '取消',
				y: '依然发送',
				callback: function(b) {
					if (b) {
						rtc.shareFile(that);
					} else {
						rtc.shareFile(that);
					}
				}
			};
			j.alert(data);
		} else {
			rtc.shareFile(this);
		}
	});
}
// 显示发送弹幕
function showTmbox() {
	if (dom.fab.classList.contains('hide_btn')) {
		hideTmbox();
	} else {
		if (event && event.keyCode == 8) {
			event.stopPropagation();
			event.preventDefault();
			return;
		};
		document.removeEventListener('keydown', showTmbox);
		dom.fab.classList.add('hide_btn');
		dom.fab.style.right = ((dom.body.offsetWidth - dom.msg.offsetWidth) / 2).toString() + 'px';
		dom.tmbox.style.overflow = 'visible';
		setTimeout(function() {
			dom.tm_card.classList.add('fromRight');
			dom.tm_card.classList.remove('toRight');
			setTimeout(function() {
				dom.tm_card.parentElement.style.boxShadow = 'rgba(0, 0, 0, 0.19) -0px 2px 6px 0px, rgba(0, 0, 0, 0.117647) 0px 1px 5px 0px, rgba(0, 0, 0, 0.2) 0px 3px 1px -2px';
				dom.msg.focus();
			}, 500);
		}, 200);
	}
}
// 隐藏弹幕盒
function hideTmbox() {
	dom.tm_card.parentElement.style.removeProperty('box-shadow');
	dom.tm_card.classList.remove('fromRight');
	dom.tm_card.classList.add('toRight');
	setTimeout(function() {
		dom.fab.classList.remove('hide_btn');
		dom.fab.style.removeProperty('right');
	}, 500);
	document.addEventListener('keydown', showTmbox);
}


function makeWss() {
	dom.i.style.display = 'none';
	const k = dom.key.value;
	if (!k) {
		alert('请输入一句话');
		return;
	}
	j.l('token_key', k);

	// 连接WebSocket服务器
	rtc.connect('wss:' + location.host + '/webrtc', k);
}
function rtcInit() {
	rtc = new webrtc();
	// 成功创建WebSocket连接
	rtc.on('connected', function(socket) {// 与服务器建立起了socket连接后触发
		// 创建本地视频流
		rtc.createStream({
			'video': true,
			'audio': true
		});
	});
	// 创建本地视频流成功
	rtc.on('stream_created', function(stream) {
		displayStream(stream, 'myself');
		dom.tmbox.style.display = 'block';
		dom.fab.style.display = 'block';
		j('.xgj').style.display = 'block';
		hideTmbox();
		setTimeout(function() {
			dom.tmbox.style.width = '100%';
		}, 500);
	});
	// 创建本地视频流失败
	rtc.on('stream_create_error', function() {
		dom.i.style.display = 'none';
		alert('create stream failed!');
	});
	// 接收到其他用户的视频流
	rtc.on('pc_add_stream', function(stream, id) {
		displayStream(stream, id);
		setTimeout(closeConnect, 180000);
	});
	// 删除其他用户
	rtc.on('remove_peer', function(socketId) {
		const video = document.getElementById('id_' + socketId);
		if (video) {
			video.parentNode.removeChild(video);
			for (let i = media_list.length - 1; i >= 0; i--) {
				if (media_list[i] == video) {
					media_list.splice(i, 1);
				}
			}
		}
	});

	rtc.messageOn('msg', function(data, id) {// 收到聊天信息
		data.type = 'peer';
		dom.body.appendChild(new tm(data));
	});
	rtc.messageOn('inputing', function(data, id) {
		// 显示对方正在输入
		const t = getVideoBox(id);
		if (data) {
			t.tip_bar.setText('对方正在输入……');
		} else {
			t.tip_bar.hide();
		}
	});
	rtc.messageOn('close_connect', function(data, id) {
		// 显示对方断开连接
		const t = getVideoBox(id);
		t.tip_bar.setText('对方已和服务器断开连接');
	});

	rtc.on('receive_file_ask', function(fid, sid, fname, fsize) {
		const end = fname.split('.').pop().toLowerCase();
		if (end == 'jpg' || end == 'jpeg' || end == 'png' || end == 'gif') {
			rtc.sendFileAccept(fid, sid);
		} else {
			fsize = (fsize / 1048576).toFixed(2);
			let con = sid + '共享了文件"' + fname + '"，大小' + fsize + 'M';
			if (fsize > 50) {
				con = sid + '共享了文件"' + fname + '"，大小' + fsize + 'M；已经大于50M，接收过大文件可能会照成视频卡顿，内存占用过大，如果电脑内存小甚至会卡死浏览器，是否接收？';
			}
			const data = {
				title: '共享文件',
				content: con,
				n: '忽略',
				y: '接受',
				callback: function(b) {
					if (b) {
						rtc.sendFileAccept(fid, sid);
					} else {
						rtc.sendFileRefuse(fid);
					}
				}
			};
			j.alert(data);
		}
	});

	rtc.on('file_end', function(sendId, socketId, name) {
		const end = name.split('.').pop().toLowerCase();
		if (end == 'jpg' || end == 'jpeg' || end == 'png' || end == 'gif') {
			const blob = rtc.getFile(sendId);
			const img = document.createElement('img');
			setTimeout('window.URL.revokeObjectURL("' + img.src + '")', 600000);// 十分钟后释放
			img.src = window.URL.createObjectURL(blob);

			const t = new tm({ msg: '', style: {} });
			t.appendChild(img);
			dom.body.appendChild(t);
		} else {
			rtc.getTransferedFile(sendId);// 保存到本地
		}
	});
	rtc.on('send_file_chunk', function(sendId, socketId, percent, file) {
		const box = getVideoBox(socketId);
		box.tip_bar.setText(percent + '%--正在发送文件' + file.name, function() {
			rtc.cancelFileSend(socketId, sendId);
			getVideoBox(socketId).tip_bar.hide();
		}, '取消发送');
	});
	rtc.on('receive_file_chunk', function(sendId, socketId, fname, percent) {
		const box = getVideoBox(socketId);
		box.tip_bar.setText(percent + '%--正在接收文件' + fname, function() {
			rtc.cancelFileReceive(socketId, sendId);
			getVideoBox(socketId).tip_bar.hide();
		}, '取消接收');
	});
	rtc.on('cancel_send', function(sendId, socketId) {
		j.alert({
			title: '发送取消',
			content: '对方已取消发送文件',
			n: '取消',
			y: '确定',
			callback: function() {
				getVideoBox(socketId).tip_bar.hide();
			}
		});
	});
	rtc.on('cancel_receive', function(sendId, socketId) {
		j.alert({
			title: '接收取消',
			content: '对方已取消接收文件',
			n: '取消',
			y: '确定',
			callback: function() {
				getVideoBox(socketId).tip_bar.hide();
			}
		});
	});
}
function closeConnect(b) {
	if (!rtc.closeConnect) return;
	for (const id in rtc.peerConnections) {
		j.alert({
			title: '断开服务器?',
			content: '当前已在视频中，断开与服务器的连接不会影响到当前视频，但有助于节省网速，提高流畅度，断开之后其他新加入房间的人也无法与你连接，是否断开？',
			n: '取消',
			y: '断开',
			callback: function(b) {
				if (b) {
					_closeConnect(b);
				} else {
					setTimeout(closeConnect, 180000);
				}
			}
		});
		return;
	}
	if (b) {
		j.alert({
			title: '断开服务器?',
			content: '当前貌似还没有跟任何人在视频中，断开之后新加入房间的人无法与你连接，是否还要断开？',
			n: '取消',
			y: '断开',
			callback: _closeConnect
		});
	}
}
function _closeConnect(b) {
	if (b) {
		rtc.closeConnect();
		delete rtc.closeConnect;
		rtc.broadcastEvent('close_connect');
		j.alert({
			title: '已断开',
			connect: '已经与服务器断开，如果有新加入的人，并不会与你产生连接，你还可以提示视频中的其他人也进行断开连接。',
			n: '',
			y: '确定',
			callback: j._noop
		});
	}
}
function inputingMsg(e) {
	if (e.keyCode == 13) {
		sendMsg();
	}

	if (!this.value) {
		if (e.keyCode == 8) {
			this._hide = this._hide || 0;
			this._hide++;
			const that = this;
			setTimeout(function() {
				that._hide = 0;
			}, 1000);
			if (this._hide >= 3) {
				hideTmbox();
			}
		}
		if (inputingMsg._inputing) {
			inputingMsg._inputing = false;
			rtc.broadcastEvent('inputing', inputingMsg._inputing);
		}
	} else {// 发送正在输入事件
		if (!inputingMsg._inputing) {
			inputingMsg._inputing = true;
			rtc.broadcastEvent('inputing', inputingMsg._inputing);
		}
	}
}


// 显示流
function displayStream(stream, id) {
	let video_view;
	if (id == 'myself') {
		dom.myself = video_view = new videoBox(stream, id, true);
		const video = video_view.video;
		video.volume = 0;
		const opt = j.ls('my_video_opt');
		if (opt) {
			video_view.style.width = opt.w;
			video_view.style.height = opt.w;
			video_view.style.top = opt.top;
			video_view.style.left = opt.left;
		}
		video_view.on('change', saveMyVideoOpt);
	} else {
		video_view = new videoBox(stream, id);
		media_list.push(video_view);
		if (!timing.time_id) {
			timing.time_id = setTimeout(timing, 1000);
		}
	}
	dom.mediaList.appendChild(video_view);
}
// 统一刷新所有进度条时间
function timing() {
	for (let i = media_list.length - 1; i >= 0; i--) {
		media_list[i].refashTime();
	}
	timing.time_id = setTimeout(timing, 1000);
}

function getVideoBox(socketId) {
	for (let i = 0; i < media_list.length; i++) {
		if (media_list[i].id == 'id_' + socketId) {
			return media_list[i];
		}
	}
}

function saveMyVideoOpt() {
	const video = this.video;
	const op = {
		'top': this.style.top || 'auto',
		'left': this.style.left || 'auto',
		'w': this.style.width,
		'h': this.style.height
	};
	j.ls('my_video_opt', op);
}


// 发送文字信息
function sendMsg() {
	let msg = dom.msg.value.trim();
	if (msg) {
		dom.msg.value = '';
		// 处理命令
		msg = msg.replace(/\@[^h]\S+/g, msgScript);
		if (!msg.length) return;
		const style = {};
		j.jsonConcat(style, tm.style);
		const msg_package = {
			'msg': msg,
			'type': 'self',
			'style': style
		};
		rtc.broadcast(msg_package);
		dom.body.appendChild(new tm(msg_package));
	}
}
// 处理简单命令
function msgScript(w) {
	const c = w.slice(1);
	let cc;
	if (c) {
		cc = c.split(':');
	}
	if (typeof cc[1] != 'undefined') {
		switch (cc[0]) {
		case 'top':
			if (cc[1] > 95)cc[1] = 95;
			if (cc[1] < 0)cc[1] = 0;
			tm.style.top = cc[1] + 'vh';
			j.ls('tm_style', tm.style, 1);
			break;
		case 'color':
			tm.style.color = cc[1];
			j.ls('tm_style', tm.style, 1);
			break;
		default:
			return w;
		}
		return '';
	}
	return w;
}


// 视频组件
function videoBox(stream, id, clear) {
	const obj = j.ui('div', this);
	obj.id = 'id_' + id;
	obj.className = 'video_div card';
	obj.setAttribute('z', '2');
	Object.defineProperty(obj, 'start_time', {
		value: new Date().getTime(),
		writable: false
	});
	obj.on('mousewheel', videoBox.scale);
	obj.on('mousedown', videoBox.dragS);
	obj.on('mouseup', videoBox.dragE);
	obj.on('mousemove', videoBox.dragM);
	obj.on('touchstart', videoBox.dragS);
	obj.on('touchend', videoBox.dragE);
	obj.on('touchmove', videoBox.dragM);
	obj.on('dblclick', videoBox.dblclick);

	obj.video = j.dom('video');
	obj.video.src = URL.createObjectURL(stream);
	obj.video.play();
	if (!clear) {
		obj.tip_bar = new tipBar();
		obj._loading_bar = new loadingBar();
		obj.appendChild(obj._loading_bar);
		obj.appendChild(obj.tip_bar);
	}

	obj.appendChild(obj.video);
	return obj;
}
// 刷新进度条时间
videoBox.prototype.refashTime = function() {
	if (this.video.played.length) {
		// var time=parseInt(this.video.played.end(0));//手机上chrome获取一直为0
		const time = parseInt((new Date().getTime() - this.start_time) / 1000);
		this._loading_bar = this._loading_bar.setTime(time);
	}
};
// 滚轮放大缩小自己视频
videoBox.scale = function() {
	let W = this.offsetWidth, H = this.offsetHeight, w, h;
	const a = 10;
	if (event.wheelDelta < 0 && W <= 100) {
		return;
	}
	w = W + (event.wheelDelta / Math.abs(event.wheelDelta)) * a;
	h = H * w / W;
	this.style.height = h.toString() + 'px';
	this.style.width = w.toString() + 'px';
	if (!this._scale_id) {
		const that = this;
		setTimeout(function() {
			delete that._scale_id;
			that.emit('change');
		}, 2000);
	}
};
// 移动自己的视频
videoBox.dragS = function() {
	this._canMove = true;
	if (event.type == 'touchstart') {
		const touch = event.changedTouches[0];
		this._layerX = touch.clientX - this.offsetLeft;
		this._layerY = touch.clientY - this.offsetTop;
	} else {
		this._layerX = event.layerX;
		this._layerY = event.layerY;
	}
};
videoBox.dragM = function() {
	if (this._canMove) {
		let x, y;
		if (event.type == 'touchmove') {
			const touch = event.changedTouches[0];
			x = touch.clientX;
			y = touch.clientY;
		} else {
			x = event.clientX;
			y = event.clientY;
		}
		const left = x - this._layerX;
		const top = y - this._layerY;
		this.style.top = top + 'px';
		this.style.left = left + 'px';
		this.style.rigth = 'auto';
	}
	event.stopPropagation(); // 阻止冒泡
	event.preventDefault(); // 阻止默认事件
};
videoBox.dragE = function() {
	this.emit('change');
	this._canMove = false;
	delete this._layerY;
	delete this._layerY;
};
videoBox.dblclick = function() {
	if (this._style) {
		this.style.top = this._style.top;
		this.style.left = this._style.left;
		this.style.width = this._style.width;
		this.style.height = this._style.height;
		delete this._style;
	} else {
		this._style = {};
		this._style.top = this.style.top;
		this._style.left = this.style.left;
		this._style.width = this.style.width;
		this._style.height = this.style.height;

		this.style.top = '0px';
		this.style.left = '0px';
		this.style.width = '100vw';
		this.style.height = '100vh';
	}
};


// 弹幕组件
function tm(data) {
	const sp = new j.ui('span', this);

	let str = data.msg;
	sp.className = 'tm';
	str = tm.make(str);
	sp.innerHTML = str;
	sp.on('animationend', tm.animationend);
	sp.on('click', tm.click);
	if (!data.style.top) {
		data.style.top = (Math.random() * 90).toString() + 'vh';
	}
	j.jsonConcat(sp.style, data.style);
	return sp;
}
tm.make = function(str) {
	// 识别网址
	str = str.replace(/\S*(http|https):\/\/\S+\.\S+/g, function(w) {
		let s, f = '', a = w.indexOf('http');
		if (a == 0) {
			s = w;
		} else {
			s = w.slice(a);
			f = w.slice(0, a);
		}
		if (f == '@') {
			return '<img src="' + s + '">';
		}
		const r = '<a href="' + s + '" target="_blank">' + s + '</a>';
		w = f + r;
		return w;
	});
	str = str.replace(/\S*www\.\S+\.\S+/g, function(w) {
		let s, f = '', a = w.indexOf('www');
		if (a == 0) {
			s = w;
		} else {
			s = w.slice(a);
			f = w.slice(0, a);
		}
		if (f.indexOf('http://') == (f.length - 7) || f.indexOf('https://') == (f.length - 8)) {
			return w;
		}
		const r = '<a href="http://' + s + '" target="_blank">' + s + '</a>';
		w = f + r;
		return w;
	});

	// 处理脚本和样式
	str = str.replace(/(<script|<\/script>|<style|<\/style>|<link|<\/link>)/g, function(w) {
		w = w.replace('<', '&lt;');
		return w.replace('>', '&gt;');
	});
	return str;
};
tm.animationend = function() {
	this.parentNode.removeChild(this);
};
tm.click = function() {
	if (this.classList.contains('animtionstop')) {
		this.classList.remove('animtionstop');
		clearTimeout(this._time_id);
		return;
	}
	this.classList.add('animtionstop');
	const that = this;
	this._time_id = setTimeout(function() {
		that.classList.remove('animtionstop');
	}, 10000);
};

// 进度条组件
function loadingBar(c) {
	const ui = new j.ui('div', this);

	ui.className = 'loading_bar';
	ui.time = 0;
	const colors = ['#428bca', '#d9534f', '#5cb85c', '#f0ad4e', '#5bc0de'];
	if (!c || c >= colors.length)c = 0;

	ui.style.background = colors[c];
	ui.color = c;
	ui.start_time = new Date().getTime();
	if (loadingBar._lsit) {
		loadingBar._list.push(ui);
	} else {
		loadingBar._list = [ui];
		loadingBar._time_id = setTimeout(loadingBar.timing, 1000);
	}
	return ui;
}
// 计时
loadingBar.prototype.setTime = function(time) {
	let bar = this, w;
	w = (time % 1200) / 12;
	bar.style.width = w.toString() + '%';
	if (w >= 100) {// 如果长度已经100%
		bar.innerHTML = '';
		const newBar = new loadingBar(bar.color + 1);
		const next = this.nextElementSibling || this.nextSibling;
		if (next) {
			bar.parentNode.insertBefore(newBar, next);
		} else {
			bar.parentNode.appendChild(newBar);
		}
		bar = newBar;
	}
	bar.innerHTML = loadingBar.getTimeText(time);
	return bar;
};
// 秒数转换成时间
loadingBar.getTimeText = function(t) {
	let text = '';
	const h = parseInt(t / 3600);
	t = t % 3600;
	const m = parseInt(t / 60);
	const s = t % 60;
	if (h && h < 10) {
		text += '0' + h.toString() + ':';
	} else if (h) {
		text += h.toString() + ':';
	}
	if (m < 10) {
		text += '0' + m.toString() + ':';
	} else {
		text += m.toString() + ':';
	}
	if (s < 10) {
		text += '0' + s.toString();
	} else {
		text += s.toString();
	}
	return text;
};
// 状态提示条
function tipBar() {
	const ui = new j.ui('div', this);

	ui.className = 'toast info_bar hide';
	ui.innerHTML = '<label class="toast-label"></label><button class="button flat color-yellow-500">关闭</button>';
	ui.querySelector('button').addEventListener('click', tipBar.click);
	return ui;
}
tipBar.prototype.setText = function(str, callback, text) {
	this.querySelector('label').innerHTML = str;
	this.querySelector('button').innerHTML = text || '关闭';
	this._callback = callback || this.hide;
	this.show();
	if (this._timeid) {
		clearTimeout(this._timeid);
	}
	const that = this;
	this._timeid = setTimeout(function() {
		that.hide();
	}, 10000);
};
tipBar.prototype.show = function() {
	this.classList.remove('toTop');
	this.classList.remove('hide');
	this.classList.add('fromTop');
};
tipBar.prototype.hide = function() {
	const that = this;
	this.classList.remove('fromTop');
	this.classList.add('toTop');
	setTimeout(function() {
		that.classList.remove('hide');
	}, 500);
};
tipBar.click = function() {
	this.parentElement._callback();
};


function dialog() {
	if (dialog.obj) {
		return dialog.obj;
	} else {
		var obj = new j.ui('div', this);
		obj.innerHTML = '<h1 class="dialog-title">请确认</h1><div class="dialog-content"><p style="word-break: break-all;">内容为空</p></div><div class="dialog-footer"><span class="float-right"><button class="button dialog-close" data-click="callback">拒绝</button><button class="button color-blue-500 dialog-confirm" data-click="callback" data-type="true">接受</button></span></div>';
		obj.on('click', function() {
			if (event.target.dataset.click) {
				this[event.target.dataset.click].call(this, event.target.dataset.type);
				this.hide();
			}
		});
		obj.className = 'dialog';
		obj.setAttribute('hidden', '');
		dialog.obj = obj;
		document.body.appendChild(obj);
		Dialog.init();
	}
	return obj;
}
dialog.prototype.setData = function(data) {
	this.querySelector('.dialog-title').innerHTML = data.title;
	this.querySelector('.dialog-content>p').innerHTML = data.content;
	this.querySelector('.dialog-close').innerHTML = data.n;
	this.querySelector('.dialog-confirm').innerHTML = data.y;

	this.callback = data.callback;
	this.show();
};
dialog.prototype.show = function() {
	Dialog.show(this);
};
dialog.prototype.hide = function() {
	Dialog.hide(this);
};
j.alert = function(data) {
	let obj;
	if (dialog.obj) {
		obj = dialog.obj;
	}
	obj.setData(data);
};
