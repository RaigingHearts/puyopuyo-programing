include("Field.js");
include("Cookie.js");
include("TinyURL.js");



//エディター***************************************************************************************
function Editor(){

	//各コンポーネント
	var field;
	var selectPanel;
	var scorePanel;
	var yokokuPanel;
	var buttonPanel;
	var codePanel;
	var memoryPanel;


	this.init = init;
	function init(){
		var size = 32;
		selectPanel = new SelectPanel();
		scorePanel = new ScorePanel("edit");
		yokokuPanel = new YokokuPanel();
		buttonPanel = new ButtonPanel();
		codePanel = new CodePanel();
		memoryPanel = new MemoryPanel();
		field = new Field("edit", scorePanel, yokokuPanel);

		document.write('<div style="width: ' + size * (field.col + 8.5) + 'px; height: ' + size * (field.row + 1) + 'px;">');

		document.write('<div style="float: left; overflow: hidden;">');
		field.write();
		document.write('</div>');//left

		document.write('<div style="float: right;">');
		selectPanel.write();
		scorePanel.write();
		yokokuPanel.write();
		buttonPanel.write();
		codePanel.write();
		memoryPanel.write();
		document.write(
				'<div style="position: relative; margin: 5px 0;">' +
				'<input type="button" value="とことんぷよぷよ" id="jumpTokopuyo">' +
				'<br>' +
				'<input type="button" value="画像生成" id="jumpImage"><select id="jumpImageScale"><option value="200">512×896</option><option value="150">384×672</option><option value="100" selected>256×448</option><option value="75">192×336</option><option value="50">128×224</option></select>' +
				'<a id="dllink" download="puyo.png" style="display:none;"></a>' +
				'<br><span style="font-size:small">DLが開始されない場合は下に表<br>示される画像を右クリックして保存</span><div style="width:72px"><img id="disp" style="max-width:100%"></div>' +
				'</div>');

		document.write('</div>');//right

		document.write('</div>');
		document.write('<br style="clear: both;">');
		field.load();
		field.save();

		document.getElementById("jumpTokopuyo").onclick = function(){
			var url = document.URL;
			url = url.substring(0, url.lastIndexOf("/")) + "/tokopuyo.html";
			window.open(url);
		}

		document.getElementById("jumpImage").onclick = function(){
			// 画像出力機能を新規で追加(pndsng)
			// フィールドサイズとぷよ1個のサイズ
			var row = 13;
			var col = 6;
			var size = 32;
			var width = size*(col+2);
			var height =  size*(row+1);

			var cvs = document.createElement("canvas");
			var ctx = cvs.getContext('2d');

			// 出力サイズの取得
			var size_scale = document.getElementById("jumpImageScale").value;

			// 背景画像を設定
			cvs.width = width*size_scale/100;
			cvs.height = height*size_scale/100;
			if(size_scale != 100){
				ctx.scale(size_scale/100, size_scale/100);
			}

			var img = new Image();
			img.src = (document.getElementById('dispnum').checked) ? "image/bg0num.png": "image/bg0.png";
			//img.src = "image/bg0.png";

			// img.onLoadがなんか反抗的なのでsleepもどきで読み込み時間待ちとして代用(飽きた)
			setTimeout(function(){
				ctx.drawImage(img, 0, 0, 256, 448, 0,  0, width, height);

				// IDの検索
				for(var i = 0; i < 65536; i++){
					if(typeof document.getElementById("field"+ID+"(0,0)") !== undefined){
						var ID = i;
						break;
					}
				}

				// ぷよ画像を重ねる
				for(var y = 0; y < row; y++){
					for(var x = 0; x < col; x++){
						img2 = document.getElementById("field"+ID+"("+y+","+x+")");
						var rect_data = img2.style.clip;
						var m = rect_data.match(/rect\(([0-9]+)px, ([0-9]+)px, ([0-9]+)px, ([0-9]+)px\)/);
						ctx.drawImage(img2, m[4], m[1], size, size, (x+1)*size,  y*size, size, size);
					}
				}

				// 出力
				img_data = cvs.toDataURL("image/png");
				var disp = document.getElementById("disp")
				disp.src = img_data;
				var link = document.getElementById("dllink")
				link.href = img_data;
				link.click();
			}, 500);
		}
	}




	function SelectPanel(){
		var size = 32;
		var row = 3;
		var col = 5;
		var list = new Array(RED, BLUE, YELLOW, GREEN, PURPLE, OZYAMA, TOKUTEN, KATAPUYO, BLACK, BLOCK, DELETE);

		//画像の行数
		var imageRow = 18;
		//画像の列数
		var imageCol = 6;
		var image = new Image();
		image.src = "image/puyo.gif";
		image.style.position = "absolute";
		image.style.width = size * imageCol + "px";
		image.style.height = size * imageRow + "px";

		var select;

		this.write = write
		function write(){
			document.write('<div style="position: relative; overflow: hidden;">' +
					'<div style="position: relative; border: 3px ridge gray; float: left;">' +
					'<div style="width: ' + size + 'px; height: ' + size + 'px;"><img src=' + image.src + ' id="select"></div>' +
					'</div>' +
					'<div style="position: relative; top: 8px; overflow: hidden;"><input type="checkbox" id="insert">Insert</div>' +
					'<br style="clear: both;">');

			document.write('<div style="position: relative; width: ' + size * col + 'px; height: ' + size * row + ';">');

			for(var i = 0; i < list.length; i++){
				drawPuyo(i, list[i]);
			}

			document.write('<div style="position:absolute; top:72px; left:55px;"><input type="checkbox" id="dispnum" onChange="dispnumBg()"><small>行/列番表示</small></div>');

			document.write('</div>');

			document.write('</div>');

			select = document.getElementById("select");


			set(list[0]);
		}


		//画像を描画する
		function drawPuyo(number, type){
			var sx = (number % 5) * size;
			var sy = (Math.floor(number / 5)) * size;

			var dx = 0;
			var dy = 0;
			if(RED <= type && type <= PURPLE){
				dx = type * size;
				dy = 0;
			}else{
				dx = 5 * size;
				dy = (type - OZYAMA) * size;
			}

			document.write('<img src=' + image.src + ' ' +
					'id="select' + number + '" ' +
					'style="position: ' + image.style.position + '; ' + 
					'width: ' + image.style.width + '; ' +
					'height: ' + image.style.height + '; ' +
					'left: ' + (sx - dx) + 'px; ' +
					'top: ' + (sy - dy) + 'px; ' +
					'clip: ' + 'rect('+ dy + 'px, ' + (dx+size) + 'px, ' + (dy+size) + 'px, ' + dx + 'px); ' +
					'">');

			document.getElementById("select" + number).onclick = function(){
				set(type);
			};
		}



		function set(type){
			select.type = type;

			var dx;
			var dy;
			if(RED <= type && type <= PURPLE){
				dx = type * size;
				dy = 0;
			}else{
				dx = OZYAMA * size;
				dy = (type - OZYAMA) * size;
			}

			select.src = image.src;
			select.style.width = image.style.width;
			select.style.height = image.style.height;
			select.style.position = "absolute";
			select.style.left = -dx + "px";
			select.style.top = -dy + "px";
			select.style.clip = "rect(" + dy + "px, " + (dx + size) + "px, " + (dy + size) + "px, " + dx + "px)";
		}
	}

	function ButtonPanel(){

		this.write = write;
		function write(){
			var width = 50;
			var height = 24;

			document.write('<div style="position: relative; margin:5px 0; font-size: 12px; overflow: hidden;">');
			button("auto", width, height);

			document.write(' speed <select id="speed">' +
					'<option value=1>1' +
					'<option value=2>2' +
					'<option value=3>3' +
					'<option value=4>4' +
					'<option value=5 selected>5' +
					'<option value=6>6' +
					'<option value=7>7' +
					'<option value=8>8' +
					'<option value=9>9' +
					'</select>');

			document.write('<br>');
			button("step", width, height);
			button("return", width, height);
			button("reset", width, height);
			document.write('<br>');
			button("load", width, height);
			document.write(' 得点ぷよ<input id="tokuten" type="text" size="3" maxlength="3" value="50">点');
			document.write('</div>');


			document.getElementById("auto").onclick = function(){
				var button = document.getElementById("auto");
				if(button.value == "auto"){
					button.value = "stop";
					field.auto();
				}
				else if(button.value == "stop"){
					field.stop();
					button.value = "auto";
				}
			};
			document.getElementById("step").onclick = function(){field.step()};
			document.getElementById("return").onclick = function(){
				field.back()
				var button = document.getElementById("auto");
				if(button.value == "stop"){
					button.value = "auto";
				}
			};
			document.getElementById("reset").onclick = function(){
				field.reset()
				var button = document.getElementById("auto");
				if(button.value == "stop"){
					button.value = "auto";
				}
			};
			document.getElementById("load").onclick = function(){
				field.load()
				var button = document.getElementById("auto");
				if(button.value == "stop"){
					button.value = "auto";
				}
			};
			document.getElementById("tokuten").onchange = function(){
				var value = document.getElementById("tokuten").value;
				if(value.match("[^0-9]") || value == ""){
					alert("半角で数値を入力してください。");
					document.getElementById("tokuten").value = 50;
				}
			};


		}

		function button(name, width, height){
			document.write('<input type="button" value="' + name + '" id="' + name + '" ' +
					'style="width:' + width + 'px; height: ' + height + 'px; text-align: center;">');
		}
	}



	function CodePanel(){

		this.write = write;
		function write(){
			document.write('<div style="position: relative; margin:5px 0;overflow: hidden;">' +
					//'URL <input id="shortURL" type="checkbox">短縮<br>' +
					'URL <input id="shortURL" type="hidden"><br>' +
					'<input type=text id="url" value="" style="width: 170px;" readonly><br>' +
					'iframe<br>' +
					'<input type=text id="iframe" value="" style="width: 170px;" readonly><br>' +
					'<input type=button style="width:50px; height: 24px;" value="save" id="save">' +
					'</div>');

			document.getElementById("save").onclick = function(){
				save();
			};

			document.getElementById("shortURL").onchange = function(){
				writeCookie();
			};

			if(getCookie("short") == 1){
				document.getElementById("shortURL").checked = true;
			}
			writeCookie();
		}



		function save(){
			var url = document.URL;
			var code = field.getCode();
			url = url.split("?")[0].replace("index.html", "") + "?" + code;
			var viewUrl = url.substring(0, url.lastIndexOf("/")) + "/view.html" + '?' + code;

			if(document.getElementById("shortURL").checked){
				getTinyURL(url, function(shortURL){
					document.getElementById("url").value = shortURL;
				});
			}else{
				document.getElementById("url").value = url;
			}

			document.getElementById("iframe").value = '<iframe src="' + viewUrl + '" width="128" height="270" frameborder="0" scrolling="no"></iframe>';
		}


		function writeCookie(){
			if(document.getElementById("shortURL").checked){
				addCookie("short", 1, 365);
			}else{
				addCookie("short", 0, 365);
			}
		}
	}




	function MemoryPanel(){

		var BLACK = "#000000";
		var GRAY = "#808080";
		var MAX = 20;
		var BLANK = "----------";
		var DEFAULT = "ぷよ図その";

		var nameData;
		var fieldData;

		//select要素
		var memory;

		var previewFrame;
		var previewField = new Field("view");



		this.write = write;
		function write(){
			readCookie();
			writeCookie();


			document.write(
				'<div style="position: relative; margin:5px 0;">' +
				'memory<br>' +
				'<select id="memory" style="width: 150px; ">' +
				'</select>' +
				'<br>' +
				'<input id="saveMemory" type="button" value="save">' +
				'<input id="loadMemory" type="button" value="load">' +
				'<input id="deleteMemory" type="button" value="delete">'
			);


			document.write(
				'<div id="previewFrame" style="position: absolute; top: 20px; left: 160px; display: none">'
			);

			previewField.write();
			previewField.reset();


			document.write(
				'</div>' +
				'</div>'
			);

			memory = document.getElementById("memory");
			previewFrame = document.getElementById("previewFrame");


			for(var i = 0; i < MAX; i++){
				if(nameData[i] == "" || nameData[i] == undefined){
					memory.length = i + 1;
					memory.options[i].value = "";
					memory.options[i].text = BLANK;
					memory.options[i].style.color = GRAY;
				}
				else{
					memory.length = i + 1;
					memory.options[i].value = fieldData[i];
					memory.options[i].text = nameData[i];
					memory.options[i].style.color = BLACK;

				}
			}
			updateColor();

			document.getElementById("saveMemory").onclick = function(){
				saveMemory();
			};
			document.getElementById("loadMemory").onclick = function(){
				loadMemory();
			};

			document.getElementById("deleteMemory").onclick = function(){
				deleteMemory();
			};


			memory.onclick = function(){

			};
			memory.onmouseout = function(){
				previewHide();
			};
			memory.onmousemove = function(){
				previewShow();
			};
			memory.onmouseover = function(){

			};
			memory.onkeypress = function(){
				previewShow();
				updateColor();
			};
			memory.onfocus = function(){
				previewShow();
			};
			memory.onblur = function(){
				previewHide();
			};
			memory.onchange = function(){
				updateColor();
			};
		}

		function previewShow(){
			if(memory.value == ""){
				previewHide();
				return;
			}
			previewFrame.style.display = "inline";
			//previewField.load("?" + memory.value);
			setTimeout(function(){previewField.load("?" + memory.value);}, 0);
		}

		function previewHide(){
			previewFrame.style.display = "none";
		}

		function updateColor(){
			var index = memory.selectedIndex;
			if(memory.options[index].text == BLANK){
				memory.style.color = GRAY;
			}
			else{
				memory.style.color = BLACK;
			}
		}


		//cookieを読み込む
		function readCookie(){
			nameData = getCookieArray("name");
			fieldData = getCookieArray("field");

			if(nameData == null){
				nameData = new Array(MAX);
				for(var i = 0; i < MAX; i++){
					nameData[i] = "";
				}
			}

			if(fieldData == null){
				fieldData = new Array(MAX);
				for(var i = 0; i < MAX; i++){
					fieldData[i] = "";
				}
			}
		}



		//クッキーを書き込む
		function writeCookie(){
			addCookieArray("name", nameData, 365);
			addCookieArray("field", fieldData, 365);
		}



		//memoryの内容をクッキーに書きこむ
		function saveMemory(){
			var index = memory.selectedIndex;
			var newName = memory.options[index].text;


			if(newName == BLANK){
				newName = DEFAULT + (index + 1);
			}


			var input = prompt("名前を付けて下さい。", newName);
			if(input == null){
				return;
			}
			while(input == ""){
				input = prompt("一文字以上入力して下さい。", newName);
				if(input == null){
					return;
				}
			}
			newName = input;


			nameData[index] = newName;
			fieldData[index] = field.getCode();
			memory.options[index].value = fieldData[index];
			memory.options[index].text = nameData[index];
			memory.options[index].style.color = BLACK;
			updateColor();

			writeCookie();
		}

		function loadMemory(){
			field.load("?" + memory.value);
			previewField.load("?" + memory.value);
		}

		function deleteMemory(){
			var index = memory.selectedIndex;
			if(memory.options[index].value == ""){
				return;
			}
			if(!confirm("本当に消去しますか？")){
				return;
			}

			nameData[index] = "";
			fieldData[index] = "";
			memory.options[index].value = fieldData[index];
			memory.options[index].text = BLANK;
			memory.options[index].style.color = GRAY;
			updateColor();

			writeCookie();
		}
	}
}
//*************************************************************************************************


function dispnumBg(){
	img = document.getElementById('puyofieldbg');
	img.src = (document.getElementById('dispnum').checked) ? "image/bg0num.png": "image/bg0.png";
}




function include(file){
	document.write('<script type=text/javascript src="src/', file, '"></script>');
}
