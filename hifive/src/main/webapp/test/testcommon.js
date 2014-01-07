/*
 * Copyright (C) 2012-2013 NS Solutions Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * hifive
 */

// resolve済みかどうかをチェックする関数
function isResolved(dfd) {
	return dfd.isResolved ? dfd.isResolved() : dfd.state() === 'resolved';
}

// reject済みかどうかをチェックする関数
function isRejected(dfd) {
	return dfd.isRejected ? dfd.isRejected() : dfd.state() === 'rejected';
}

// rgb(0,0,0) -> #00000 に変換しかつ、#001122を#012のようにショートハンドにする
function rgbToHex(rgbStr) {
	if (/^#\d{3,6}$/.test(rgbStr)) {
		return rgbStr;
	}

	var hexStr = '#';
	var patterns = rgbStr.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

	if (!patterns) {
		return rgbStr;
	}

	var hexs = [];

	for ( var i = 1; i < patterns.length; i++) {
		hexs.push(("0" + parseInt(patterns[i]).toString(16)).slice(-2));
	}

	// #9922ff->#92fのようにショートハンドに変換する
	if (hexs[0][0] === hexs[0][1] && hexs[1][0] === hexs[1][1] && hexs[2][0] === hexs[2][1]) {
		hexStr += (hexs[0][0] + hexs[1][0] + hexs[2][0]);
	} else {
		hexStr += hexs.join('');
	}

	return hexStr;
}

function isDevMode() {
	return !!h5.dev;
}

function isDisposed(controller) {
	var ret = true;
	for ( var p in controller) {
		if (controller.hasOwnProperty(p) && controller[p] !== null) {
			ret = false;
		}
	}
	return ret;
}

// iframeを作成
function createIFrameElement() {
	var dfd = h5.async.deferred();
	var iframe = document.createElement('iframe');
	$('#qunit-fixture').append(iframe);
	// chrome,safari,operaの場合、iframeをappendした瞬間にreadystatechange='complete'になっている
	// ie,firefoxの場合はuninitializedなので、readyStateが'complete'になるのを待つ必要があるので、
	// 共通で待機できるようsetTimeout()でチェックして完了するまで待っている。
	// # onreadystatechangeはfirefoxの場合だと使えない。
	// # firefoxでは、iframeの準備ができたらcontentDocumentが指し替わる。
	// # 指し替わる前のdocumentのreadystateはずっとuninitializedのままなので、ハンドラを引っかけても発火しない
	function check() {
		// ifrae.contentDocumentはIE7-で使えないので、contentWindowからdocumentを取得
		var doc = iframe.contentWindow.document;
		if (doc.readyState !== 'complete') {
			setTimeout(check, 10);
			return;
		}
		if (h5.env.ua.isIE && h5.env.ua.browserVersion === 11 && $().jquery === '1.10.1') {
			// IE11でjQuery1.10.1の場合、iframe内の要素をjQueryで操作するとき、
			// jQuery内部のsetDocumentでattachEventが呼ばれてエラーになる
			// (IE11にはattachEventがないため)
			// エラー回避のため、addEventListenerを呼ぶ関数をattachEventに設定しておく
			iframe.contentWindow.attachEvent = function(ev, func) {
				this.addEventListener(ev.slice(ev.indexOf('on') ? 0 : 2), func);
			};
		}
		dfd.resolve(iframe, doc);
	}
	setTimeout(check, 10);
	return dfd.promise();
}

// ポップアップウィンドウを開く
function openPopupWindow() {
	var dfd = h5.async.deferred();
	var w = window.open();
	if (w == null) {
		// ポップアップブロックされていた場合はrejectして終了
		return dfd.reject().promise();
	}
	function load() {
		dfd.resolve(w);
	}

	// Firefoxの場合は、window.openで新しいwindowが同期で開き、readyStateが取得できないので、compelteでなくても同期でload()を呼ぶ
	if (w.document && w.document.readyState === 'complete' || h5.env.ua.isFirefox) {
		load();
		return dfd.promise();
	}
	// openしたウィンドウの状態は、こちらのスクリプト実行中に変わる可能性があるので、
	// loadイベントを拾うのではなく、setIntervalで監視する
	var timer = setInterval(function() {
		if (w.document && w.document.readyState === 'complete') {
			clearInterval(timer);
			load();
		}
	}, 100);
	return dfd.promise();
}

// ポップアップウィンドウを閉じる
function closePopupWindow(w) {
	var dfd = h5.async.deferred();
	function unloadFunc() {
		dfd.resolve(w);
	}
	// jQueryのbindでバインドすると、バインド対象に対してdeleteを使ってjQueryキャッシュを消す処理が非同期で走り、
	// close済みのwindowオブジェクトに対する操作IEでエラーになる。
	// そのため、jQueryを使わずにバインドしている
	if (w.addEventListener) {
		w.addEventListener('unload', unloadFunc);
	} else {
		w.attachEvent('onunload', unloadFunc);
	}
	w.close();
	return dfd.promise();
}

// 現在実行中のテストをスキップする。テストケース内(test,asyncTest)から呼ばれることを想定している
function skipCurrentTest() {
	// テストが成功するようにする
	ok(true, 'テストをスキップしました');
	QUnit.config.current.expected = null;

	// テスト名の先頭に[テストをスキップしました]を付けて表示する
	var replace = '';
	$(QUnit.config.current.nameHtml).each(function() {
		if ($(this).hasClass('test-name')) {
			$(this).text('[テストをスキップしました]' + $(this).text());
		}
		replace += this.outerHTML || this.nodeValue;
	});
	QUnit.config.current.nameHtml = replace;
}