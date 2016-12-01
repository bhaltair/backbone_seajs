


/*****************模型*******/
var imageModel = Backbone.Model.extend({
	initialize : function (obj) {
		/* 适配模型 */
		var w = ($(window).width() - 18) / 2;
		var h = w / obj.width * obj.height;
		this.set('viewWidth',w)
		this.set('viewHeight',h)
	}
		
})



/***********集合*************/
var imageCollection = Backbone.Collection.extend({
	model : imageModel,
	id : 0,
	fetchData : function () {
		var me = this;
		$.get('data/imageList.json',function (res) {
			if(res && res.errno === 0){
				res.data.sort(function(){
					return Math.random() > .5 ? 1 : -1;
				})
				$.each(res.data, function(index, val) {
					val.id = ++me.id;
				});
				me.add(res.data)
			}
		})	
	}
})

var ic = new imageCollection()

/************视图****************/
var imageView = Backbone.View.extend({

	events : {
		'tap .nav li' : 'navSelect',
		'tap .bg span' : 'enter',
		'tap .gotop' : 'gotop'
	},

	leftHeight : 0,
	rightHeight : 0,

	tpl : _.template('<a href="#pic/<%=id%>"><img src="<%=url%>" class="" /></a>'),

	gotop : function (e) {
		/* body... */
		$("body").scrollTop(0);
	},
	navSelect : function(e) {
		$(e.target).addClass('cur').siblings().removeClass('cur')
		var idx = $(e.target).data('type')
		// 视图控制器从模型中取出数据，交给视图渲染
		var result = this.collection.filter(function(model) {
			return model.get('type') === idx
		});
		this.clearView();
		this.resetView(result);
	},

	enter : function (e) {
		/* body... */
		this.$el.find('.bg').hide();
		this.$el.find('.page2').show()
	},
	initialize : function() {
		// 监听集合add事件
		this.listenTo(this.collection,'add',function (model) {
	        
			this.render(model);
		})

		// 缓存DOM
		this.initDOM();

		// 获取数据
		this.collection.fetchData()

		// 自动加载
		var me = this;
		$(window).on('scroll',function(){
			if($(window).scrollTop() > 100){
				$('.gotop').show()
			}else {
				$('.gotop').hide()

			}

			if($('body').height() < $(window).scrollTop() + $(window).height() + 200){
				// 模拟加载更多图片
				me.collection.fetchData()
			}
		})
	},
	initDOM : function () {
		this.leftContainer = this.$el.find('.left');
		this.rightContainer = this.$el.find('.right');
	},

	clearView : function () {
		this.rightContainer.html('');
		this.leftContainer.empty();
		// 清空高度
		this.leftHeight = 0;
		this.rightHeight = 0;		
	},

	resetView : function (model) {
		/* body... */
		var me = this;
		_.each(model,function(el, index) {
			me.render(el)
		});
	},
	render : function (model,collection) {
		// add事件每一次都进入
		var h = model.get('viewHeight')
		var data = model.toJSON()
		var tpl = this.tpl;
		var html = tpl(data);


		if (this.leftHeight > this.rightHeight) {
			this.rightContainer.append(html);
			this.rightHeight += h;
		}else {
			this.leftContainer.append(html);
			this.leftHeight += h;
		}

	}
})


var iv = new imageView({
	el : $("#app"),
	collection : ic
})


var picView = Backbone.View.extend({

	events : {
		'tap .goback' : 'goback',
		'swipeLeft .pic img' : 'showNext',
		'swipeRight .pic img' : 'showPrev',
		'tap .pic img' : 'taplistener'

	},
	
	nowidx : 0,
	showNext : function (event) {
		this.imagID ++;
		var model = this.collection.get(this.imagID);

		// 如果得不到model，表示到头了
		if(!model){
			this.imagID--;
			return;
		}else{
			this.updateView(model);			
			event.preventDefault();
			$(".pic li").eq(this.nowidx).animate({"transform":"translateX(-100%)"},500);
			this.nowidx++;
			if(this.nowidx > 2){
				this.nowidx = 0;
			}
			// 设置下一张图片的src属性
			$('.pic li').eq(this.nowidx).find('img').attr('src',model.get('url'));
			$(".pic li").eq(this.nowidx).css("transform","translateX(100%)").animate({"transform":"none"},500);		
		}
	},


	showPrev : function (event) {
		this.imagID --;
		var model = this.collection.get(this.imagID);

		if(!model){
			this.imagID++;
			return;
		}else{
			this.updateView(model);
			event.preventDefault();
			$(".pic li").eq(this.nowidx).animate({"transform":"translateX(100%)"},500);
			this.nowidx--;
			if(this.nowidx < 0){
				this.nowidx = 2;
			}
			$('.pic li').eq(this.nowidx).find('img').attr('src',model.get('url'));
			$(".pic li").eq(this.nowidx).css("transform","translateX(-100%)").animate({"transform":"none"},500);				
		}

	},

	updateView : function (Model) {
		/* 更改标题... */
		// this.$el.find('.pic img').attr('src', Model.get('url'));
		this.$el.find('.header .title').html(Model.get('title'));
		// location.hash = '#pic/' + Model.get('id')

	},

	taplistener : function (argument) {
		this.$el.find('.pic .header').toggleClass('hide')
	},

	goback : function (argument) {
		history.go(-1)
    	// iv.$el.find('.pic').hide();
    	// iv.$el.find('.page2').show();		
	},

	tpl : _.template($('#picLayer').html()),
	h : $(window).height(),

	render : function (modelId) {
		// 重置idx 很重要！！！
		this.nowidx = 0;

		var tpl = this.tpl;
		this.imagID = modelId;
		var model = this.collection.get(modelId);
		if(!model){
			location.href = '';
			return;
		}
		var tmp = model.toJSON();
		// 写入行高，使得图片垂直居中
		tmp.style = 'line-height : ' + this.h + 'px';
		var html = tpl(tmp)
		this.$el.find('.pic').html(html);

	}
})



var ip = new picView({
	el : $("#app"),
	collection : ic
})


/*****************路由*******/
var Router = Backbone.Router.extend({
    routes: {
        'pic/:id': 'showPic',
        '*default': 'showList'
    },

    showList: function() {
    	// 隐藏第3页
    	iv.$el.find('.page3').hide();
    	iv.$el.find('.page2').show();
    },

    showPic: function(id) {
    	// 隐藏第2页
    	iv.$el.find('.page2').hide();
    	// 显示第3页
    	// 渲染第3页
        ip.render(id);
    	iv.$el.find('.page3').show();
    }
})



// *********************
var router = new Router()
Backbone.history.start();



