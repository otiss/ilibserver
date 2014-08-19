var lodash_tmpl = require('lodash-template')

var template = [
                '<xml>',
                '<ToUserName><![CDATA[<%- uid %>]]></ToUserName>',
                '<FromUserName><![CDATA[<%- sp %>]]></FromUserName>',
                '<CreateTime><%= Math.floor(createTime.valueOf() / 1000) %></CreateTime>',
                '<MsgType><![CDATA[<%= msgType %>]]></MsgType>',
                '<% if (msgType === "news") { %>',
                  '<ArticleCount><%=content.length%></ArticleCount>',
                  '<Articles>',
                  '<% content.forEach(function(item){ %>',
                    '<item>',
                      '<Title><![CDATA[<%=item.title%>]]></Title>',
                      '<Description><![CDATA[<%=item.description%>]]></Description>',
                      '<PicUrl><![CDATA[<%-item.picUrl || item.picurl || item.pic %>]]></PicUrl>',
                      '<Url><![CDATA[<%=item.url%>]]></Url>',
                    '</item>',
                  '<% }) %>',
                  '</Articles>',
                '<% } else if (msgType === "music") { %>',
                  '<Music>',
                    '<Title><![CDATA[<%=content.title%>]]></Title>',
                    '<Description><![CDATA[<%=content.description%>]]></Description>',
                    '<MusicUrl><![CDATA[<%-content.musicUrl || content.url %>]]></MusicUrl>',
                    '<HQMusicUrl><![CDATA[<%-content.hqMusicUrl || content.hqUrl %>]]></HQMusicUrl>',
                  '</Music>',
                '<% } else if (msgType === "voice") { %>',
                  '<Voice>',
                    '<MediaId><![CDATA[<%-content.mediaId%>]]></MediaId>',
                  '</Voice>',
                '<% } else if (msgType === "image") { %>',
                  '<Image>',
                    '<MediaId><![CDATA[<%-content.mediaId%>]]></MediaId>',
                  '</Image>',
                '<% } else if (msgType === "video") { %>',
                  '<Video>',
                    '<Title><![CDATA[<%=content.title%>]]></Title>',
                    '<Description><![CDATA[<%-content.description%>]]></Description>',
                    '<MediaId><![CDATA[<%-content.mediaId%>]]></MediaId>',
                    '<ThumbMediaId><![CDATA[<%-content.thumbMediaId%>]]></ThumbMediaId>',
                  '</Video>',
                '<% } else { %>',
                  '<Content><![CDATA[<%=content%>]]></Content>',
                '<% } %>',
              '</xml>'
            ].join('');

module.exports = function(config, webot, models){
	//url元素不能html escape，否则会把&转义为&amp;
	webot.wechat.dump = lodash_tmpl(template);

	require('./event.subscribe')(webot, models, config);
	require('./event.unsubscribe')(webot, models);
	require('./event.location')(webot, models);
	require('./event.click')(webot, models, config);
	require('./event.scan')(webot, models, config);
	require('./text')(webot, models);
}