/*
 * Runstant
 * 思いたったらすぐ開発. プログラミングに革命を...
 * jsでのコメントの書き方です
 */
// これもjsでのコメントの書き方です

// phina.jsで用意されているclassをどこからでも使えるようにします。とりあえず"おまじない"と思ってもらえればOKです
phina.globalize();

// まずはもろもろの設定値を定義します。
// ソースコードの冒頭部で定義しておくと、設定の変更や見直しが容易になります。
var SCREEN_WIDTH    = 640; //スクリーンの横幅
var SCREEN_HEIGHT   = 960; //スクリーンの縦幅
var MAX_PER_LINE    = 8; //x軸(横)方向のブロック数
var BLOCK_NUM       = MAX_PER_LINE*5; //総ブロック数(整数=y軸方向のブロックライン数) sampleコードの場合5ライン全40ブロック
var BLOCK_SIZE      = 64; //ブロックの大きさ
var BOARD_PADDING   = 50; //
var PADDLE_WIDTH    = 150; //球を弾くバーのx軸方向(横)の幅
var PADDLE_HEIGHT   = 32; //球を弾くバーのy軸方向(縦)の幅
var BALL_RADIUS     = 16; //球の半径
var BALL_SPEED      = 16; //球の速さ

var BOARD_SIZE      = SCREEN_WIDTH - BOARD_PADDING*2; //ブロック間の距離感
var BOARD_OFFSET_X  = BOARD_PADDING+BLOCK_SIZE/2; //スクリーンのx軸方向(横)の投影位置
var BOARD_OFFSET_Y  = 150; //スクリーンのy軸方向(縦)の投影位置

// "phina.define"でclass定義をします。下記のsampleではスコア計算やゲームの開始~終了までの動作などを定義しています。
phina.define("MainScene", {
    superClass: 'DisplayScene',

    init: function(options) {
        this.superInit(options);

        // スコアラベル(画面真ん中上部の点数)
        // addChildToを使うことで対象オブジェクトが画面描画できます
        this.scoreLabel = Label('0').addChildTo(this); //スコアの表示
        this.scoreLabel.x = this.gridX.center(); //x軸(横)方向の位置
        this.scoreLabel.y = this.gridY.span(1); //y軸(縦)方向の位置
        this.scoreLabel.fill = 'white'; //色指定

        // グループ ※配置物の管理に利用する概念。少し難しいので今はわからなくてもOK。詳しくはreadme.txtのURL参照
        // 少し補足すると、sampleの場合は複数のブロックを群として1つのまとまりとする。
        this.group = DisplayElement().addChildTo(this);

        // ブロックを配置するマス目を設定
        var gridX = Grid(BOARD_SIZE, MAX_PER_LINE);
        var gridY = Grid(BOARD_SIZE, MAX_PER_LINE);

        var self = this;

        // BLOCK_NUMの回数だけブロック描画を行う。iは0からBLOCK_NUM-1の値をとる。
        (BLOCK_NUM).times(function(i) {
            // グリッド上でのインデックス
            var xIndex = i%MAX_PER_LINE;
            var yIndex = Math.floor(i/MAX_PER_LINE); // i/MAX_PER_LINEの値を少数以下切り捨て
            var angle = (360)/BLOCK_NUM*i; // ブロックの色を少しづつ変えて設定する
            var block = Block(angle).addChildTo(this.group).setPosition(100, 100);

            block.x = gridX.span(xIndex) + BOARD_OFFSET_X; // span()でブロックの設置位置(x軸方向)を決定する
            block.y = gridY.span(yIndex)+BOARD_OFFSET_Y; // span()でブロックの設置位置(y軸方向)を決定する
        }, this);

        // ボールの描画
        this.ball = Ball().addChildTo(this);
        
        // パドルの描画
        this.paddle = Paddle().addChildTo(this);
        // パドルの初期位置の設定
        this.paddle.setPosition(this.gridX.center(), this.gridY.span(15));
        // パドルとボールの初期位置関係
        this.paddle.hold(this.ball);

        // タッチでゲーム開始
        this.ballSpeed = 0; //ボールの速さの初期化
        this.one('pointend', function() {
            this.paddle.release(); //ボール射出メソッド
            this.ballSpeed = BALL_SPEED; //射出時のボールの速さ設定
        });

        // スコアの初期値
        this.score = 0;
        // 時間の初期値
        this.time = 0;
        // コンボの初期値
        this.combo = 0;
    },

    // 毎フレームごとに行う処理を記述する
    update: function(app) {
        // タイムを加算
        this.time += app.deltaTime;

        // パドル移動
        this.paddle.x = app.pointer.x;
        //パドルの左端がスクリーン左端に接地した場合の、パドル左端の位置の設定
        //ここではパドルが画面左側外への飛び出し防止のために設定
        if (this.paddle.left < 0) {
            this.paddle.left = 0;
        }
        //上記設定の右側ver
        if (this.paddle.right > this.gridX.width) {
            this.paddle.right = this.gridX.width;
        }

        // スピードの数分, 移動と衝突判定を繰り返す
        (this.ballSpeed).times(function() {
            this.ball.move();
            this.checkHit();
        }, this);

        // ブロックがすべてなくなったらクリア
        if (this.group.children.length <= 0) {
            this.gameclear();
        }
    },

    checkHit: function() {
        // ボールの生成
        var ball = this.ball;

        // ボールの設定 スタート
        // 画面外対応
        if (ball.left < 0) {
            ball.left = 0;
            ball.reflectX(); //ボールの跳ね返り。x軸(横)方向のボールの進行方向を逆転する
        }
        if (ball.right > this.gridX.width) {
            ball.right = this.gridX.width
            ball.reflectX(); //ボールの跳ね返り。x軸(横)方向のボールの進行方向を逆転する
        }
        if (ball.top < 0) {
            ball.top = 0;
            ball.reflectY(); //ボールの跳ね返り。y軸(横)方向のボールの進行方向を逆転する
        }
        if (ball.bottom > this.gridY.width) {
            ball.bottom = this.gridY.width
            ball.reflectY(); //実はなくてもよい。ボール下部がスクリーン下に接地したらゲームオーバーになるため。
            this.gameover(); //ボールの跳ね返り。ボール下部がスクリーン下に接地したらゲームオーバー
        }

        // ボールがパドルで跳ね返った時の動作
        if (ball.hitTestElement(this.paddle)) {
            ball.bottom = this.paddle.top;

            var dx = ball.x - this.paddle.x; //ボールがバーのどの位置に当たるかで、跳ね返り方向(角度)を決定する
            ball.direction.x = dx;
            ball.direction.y = -80;
            ball.direction.normalize();

            // ボールが跳ね返るたびにボールの速さアップ
            this.ballSpeed += 1;

            // コンボ数をリセット
            this.combo = 0;
        }

        this.group.children.some(function(block) {
            // ボールがブロックで跳ね返った時の動作
            if (ball.hitTestElement(block)) {
                var dq = Vector2.sub(ball, block);
                // x軸方向に跳ね返るか、y軸方向に跳ね返るかの判定
                if (Math.abs(dq.x) < Math.abs(dq.y)) {
                    // y軸方向に跳ね返る場合
                    ball.reflectY();
                    // ブロックの下からボールがぶつかる場合
                    if (dq.y >= 0) {
                        ball.top = block.bottom;
                    }
                    // ブロックの上からボールがぶつかる場合
                    else {
                        ball.bottom = block.top;
                    }
                }
                // x軸方向に跳ね返る場合
                else {
                    ball.reflectX();
                    // ブロックの右からぶつかる場合
                    if (dq.x >= 0) {
                        ball.left = block.right;
                    }
                    // ブロックの左からぶつかる場合
                    else {
                        ball.right = block.left;
                    }
                }

                block.remove();

                this.combo += 1; //コンボ数カウント。ボールがバーにぶつからない間にブロックを連続で消した時に加算する
                this.score += this.combo*100; //コンボ補正による加算値アップ

                var c = ComboLabel(this.combo).addChildTo(this);
                c.x = this.gridX.span(12) + Math.randint(-50, 50); //コンボカウンターのx軸(横)方向表示位置計算。多少のランダム要素を出す為にrandintを利用
                c.y = this.gridY.span(12) + Math.randint(-50, 50); //コンボカウンターのy軸(縦)方向表示位置計算。多少のランダム要素を出す為にrandintを利用

                return true;
            }
        }, this);
    },

    // ゲームクリア時に呼ばれる関数
    gameclear: function() {
        // クリアボーナスをクリア時のスコアに加算する
        var bonus = 2000;
        this.score += bonus;

        // タイムボーナスを計算し、クリア時のスコアに加算する
        var seconds = (this.time/1000).floor();
        var bonusTime = Math.max(60*10-seconds, 0);
        this.score += (bonusTime*10);

        this.gameover();
    },

    // ゲーム終了時に呼ばれる関数
    gameover: function() {
        this.exit({
            score: this.score,
        });
    },

    // スコア表示時に呼ばれる関数
    _accessor: {
        score: {
            get: function() {
                return this._score;
            },
            set: function(v) {
                this._score = v;
                this.scoreLabel.text = v;
            },
        },
    }

});

/*
 * 各ブロックの設定値
 */
phina.define('Block', {
    superClass: 'RectangleShape',

    init: function(angle) {
        this.superInit({
            width: BLOCK_SIZE, //ブロックの横幅
            height: BLOCK_SIZE, //ブロックの縦幅 (sampleの場合、縦=横なので正方形のブロックになります)
            fill: 'hsl({0}, 80%, 60%)'.format(angle || 0), //ブロックの色。 hsl(色,彩度,輝度) formatによってangleまたは0が色としてブロックの色として利用される
            stroke: null, //ブロックの外枠の線
            cornerRadius: 8, //ブロックの角の丸み
        });
    },
});

/*
 * ボールの設定値
 */
phina.define('Ball', {
    superClass: 'CircleShape',

    init: function() {
        this.superInit({
            radius: BALL_RADIUS, //ボールの半径
            fill: '#eee', //ボールの色
            stroke: null, // ボールの外枠の線
            cornerRadius: 8, // ボールの丸み
        });

        this.speed = 0; //ボールの速さの初期化。ゲーム開始時に必ずBALL_SPEEDが設定される。
        this.direction = Vector2(1, -1).normalize(); //ボールの射出方向。右下斜め45度に射出してパドルに跳ね返るように射出する。
    },

    // ボールの進行方向を設定する
    move: function() {
        this.x += this.direction.x;
        this.y += this.direction.y;
    },

    // 跳ね返りの時にボールのx軸(横)方向進行方向を反転する
    reflectX: function() {
        this.direction.x *= -1;
    },
    // 跳ね返りの時にボールのy軸(縦)方向進行方向を反転する
    reflectY: function() {
        this.direction.y *= -1;
    },
});

/*
 * パドルの設定値
 */
phina.define('Paddle', {
    superClass: 'RectangleShape',
    init: function() {
        this.superInit({
            width: PADDLE_WIDTH, //パドルの横幅
            height: PADDLE_HEIGHT, //パドルの縦幅
            fill: '#eee', //パドルの色
            stroke: null, // パドルの外枠の線
            cornerRadius: 8, //パドルの角の丸み
        });
    },

    //ゲーム開始時のボールの初期位置設定
    hold: function(ball) {
        this.ball = ball;
    },

    release: function() {
        this.ball = null;
    },

    // 毎フレームごとに行う処理を記述する
    update: function() {
        if (this.ball) {
            this.ball.x = this.x;
            this.ball.y = this.top-this.ball.radius;
        }
    }
});

/*
 * コンボラベルの設定値
 */
phina.define('ComboLabel', {
    superClass: 'Label',
    init: function(num) {
        this.superInit(num + ' combo!');

        this.stroke = 'white'; //combo表示の外枠の線色
        this.strokeWidth = 8; //外枠線の幅

        // 数によって色とサイズを分岐
        if (num < 5) {
            // 5combo未満の時
            this.fill = 'hsl(40, 60%, 60%)';
            this.fontSize = 16;
        }
        else if (num < 10) {
            // 10combo未満の時
            this.fill = 'hsl(120, 60%, 60%)';
            this.fontSize = 32;
        }
        else {
            // 10combo以上の時
            this.fill = 'hsl(220, 60%, 60%)';
            this.fontSize = 48;
        }

        // フェードアウトして削除
        this.tweener // tweenerを利用することでphina.jsのオブジェクトに対してアニメーションを設定できる
            .by({
                alpha: -1,
                y: -50,
            })
            .call(function() {
                this.remove();
            }, this)
        ;
    },
});

// phina.mainの中にメイン処理を記述する
phina.main(function() {
    // ゲーム(アプリ)起動
    var app = GameApp({
        title: 'Breakout', //ゲーム起動時に表示するタイトル
        startLabel: location.search.substr(1).toObject().scene || 'title',
        width: SCREEN_WIDTH, //ゲームスクリーンの横幅
        height: SCREEN_HEIGHT, //ゲームスクリーンの縦幅
        backgroundColor: '#444', //ゲームスクリーンの背景色
        autoPause: true,
        debug: false,
    });
    // メモリ使用量やfps等を表示する
    app.enableStats();
    // アプリ実行。書かなかったらアプリが動かないので記載すること。
    app.run();
});