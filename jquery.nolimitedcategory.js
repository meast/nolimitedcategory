/*
 *   charset:utf-8
 * nolimited category plugin
 * author:meast
 * options.data 必须包含 编号、名称、父级、序列、是否为最后一级(bool)
 * 编号、名称、父级、序列、是否为最后一级 这些的key可以根据您的数据实际的key作为参数传入.
 * 选择后按层次显示文字序列：默认不显示，options中指定了ShowTargetId的值并且中能找到这个ID的容器之后就会在选项被改变时进行操作。
 * 选择最后一级后向指定容器设置ID值：默认不显示，options中指定了LastValueId的值并且页面中能找到这个ID的容器之后就会进行操作。
*/

;(function($){
    $.fn.extend({
        nolimitedcategory:function(options){
            var _this = $(this);
            options = $.extend({
                data : [],// 二维的JSON，包括的键如果不是下方几个，请传入相应的键名
                ItemId : "ItemId",
                ItemName : "ItemName",// 节点名称
                ItemNodePath : "ItemNodePath",// 以特定符号(默认英文逗号,非英文逗号分隔时需要指定INPSeparator的值)分割的节点序列
                ItemParentId : "ItemParentId",// 父级编号
                IsLastNode : "IsLastNode",
                INPSeparator : ",", // ItemNodePath 分割符
                DefaultOptionText : "请选择",
                DefaultOptionValue : 0,
                DefaultPID : 0,
                MaxNode : 0,
                SelectedId : 0, // 已经被选择的
                LastValueId : "", // 选择了最后一级之后，把这个值设到这个ID的容器上，使用val方法。
                ShowTargetId : "",// 选择了之后把文字显示在这个ID的容器上
                ShowSeparator : " > ",// 选择了之后文字显示两级之间的分隔符
                Prefix : "s-",//前缀，一个页面使用多个无限级菜单时使用.(有点多余的感觉.)
                callback : null
            } , options);
            
            var init = function(){
                // 生成各级下拉框，并赋值第一个框，若已定义末级ID则操作选择
                var _thisid = _this.attr("id");
                options.Prefix = _thisid + options.Prefix;
                buildmainselect();
                bindingnodevals(1, options.DefaultPID, options.DefaultOptionValue);
                if(options.SelectedId > 0){
                    bindinglastid();
                }
            };
            
            var calcmaxnode = function(){
                var _maxnode = 0;
                if(options.data.length > 0){
                    for(_i = 0; _i < options.data.length; _i++){
                        var _nodelength = options.data[_i][options.ItemNodePath].split(options.INPSeparator).length;
                        //if(options.data[_i][options.ItemNode] > _maxnode){
                        if(_nodelength > _maxnode){
                            _maxnode = _nodelength;
                        }
                    }
                }
                if(options.MaxNode > _maxnode){
                    options.MaxNode = _maxnode;
                }
                return _maxnode;
            };
            
            var buildmainselect = function(){
                if(options.MaxNode<=0){
                    // 确定最大层次
                    options.MaxNode = calcmaxnode();
                }
                _html = "<div id=\""+options.Prefix+"wrapper\">";
                for(i = 0; i < options.MaxNode; i++){
                    _html += " <select id=\""+options.Prefix+(i+1)+"\" data-node=\""+(i + 1)+"\"><option value=\""+options.DefaultOptionValue+"\">"+options.DefaultOptionText+"</option></select> ";
                }
                _html += "</div>";
                _this.append(_html);
                jQuery("#" + options.Prefix + "wrapper").delegate("select[id^="+options.Prefix+"]", "change", function(){
                    _that = jQuery(this);
                    _idn = _that.attr("id");
                    _val = _that.val();
                    _val = parseInt(_val);
                    if(_val > 0){
                        var _node = _that.data("node");
                        _node = parseInt(_node);
                        _txt = jQuery("#" + _idn + " option:selected").text();
                        _islastnode = jQuery("#" + _idn + " option:selected").data("islastnode");
                        if(_islastnode.toString().toLowerCase() == "true"){
                            // 重置下一层
                            if(_node < options.MaxNode){
                                jQuery("#" + options.Prefix + (_node + 1)).html("<option value=\""+options.DefaultOptionValue+"\">"+options.DefaultOptionText+"</option>");
                            }
                        } else {
                            // 不是最后一节，并且不是默认项
                            if(_val > 0){
                                bindingnodevals(_node + 1, _val, options.DefaultOptionValue);
                            }
                        }
                        showselectedtext();
                    }
                });
            };
            
            // 列出被选择的文字、设置最后被选择的ID
            var showselectedtext = function(){
                if(options.ShowTargetId){
                    var _txt = "";
                    for(i = 0; i < options.MaxNode; i++){
                        var _val = jQuery("#" + options.Prefix + (i + 1)).val();
                        var _ntxt = jQuery("#" + options.Prefix + (i + 1) + " option:selected").text();
                        var _islastnode = jQuery("#" + options.Prefix + (i + 1) + " option:selected").data("islastnode");
                        if(_val != options.DefaultOptionValue){
                            _txt += _ntxt;
                            if(_islastnode.toString().toLowerCase() == "true" || i == (options.MaxNode - 1)){
                                // 最后一级被选择了，是否设置值
                                if(options.LastValueId && typeof(jQuery("#" + options.LastValueId)) == "object"){
                                    jQuery("#" + options.LastValueId).val(_val);
                                }
                            }else{
                                _txt += options.ShowSeparator;
                            }
                        }
                    }
                    if(typeof(jQuery("#" + options.ShowTargetId)) == "object")
                    jQuery("#" + options.ShowTargetId).html(_txt);
                }
            };
            
            var bindinglastid = function(){
                if(options.SelectedId > 0){
                    // 取出这个ID对应的实体并倒推前边的选择项
                    var _entity = selectentitybyid(options.SelectedId);
                    if(_entity){
                        _node = _entity[options.ItemNodePath].split(options.INPSeparator).length;
                        if(_node > 0){
                            for(_i = _node; _i > 0; _i--){
                                if(typeof(_entity) != "undefined"){
                                    bindingnodevals(_i, _entity[options.ItemParentId], _entity[options.ItemId]);
                                    _entity = selectentitybyid(_entity[options.ItemParentId]);
                                }
                            }
                        }
                    }
                }
                showselectedtext();
            };
            
            var bindingnodevals = function(node, pid, selectedval){
                var _arr = getarrbypid(pid);
                var _html = "";
                if(_arr.length > 0){
                    _html += "<option value=\""+options.DefaultOptionValue+"\">"+options.DefaultOptionText+"</option>";
                    for(i = 0; i < _arr.length; i++){
                        if(_arr[i][options.ItemId] == selectedval){
                            _html += "<option value=\""+_arr[i][options.ItemId]+"\" data-islastnode=\""+_arr[i][options.IsLastNode]+"\" selected=\"selected\">"+_arr[i][options.ItemName]+"</option>";
                        }else{
                            _html += "<option value=\""+_arr[i][options.ItemId]+"\" data-islastnode=\""+_arr[i][options.IsLastNode]+"\">"+_arr[i][options.ItemName]+"</option>";
                        }
                    }
                    if(node < options.MaxNode){
                        // 非倒列的情况下，重置下一级选项
                        if(selectedval <= options.DefaultOptionValue)
                        jQuery("#" + options.Prefix + (node+1)).html("<option value=\""+options.DefaultOptionValue+"\">"+options.DefaultOptionText+"</option>");
                    }
                }
                if(jQuery("#" + options.Prefix + node)){
                    jQuery("#" + options.Prefix + node).html(_html);
                }
            }
            
            var getarrbypid = function(pid){
                var _arr = [];
                if(pid>=0){
                    if(options.data.length > 0){
                        var _j = 0;
                        for(var _i in options.data){
                            if(options.data[_i][options.ItemParentId] == pid){
                                _arr.push(options.data[_i]);
                            }
                        }
                    }
                }
                return _arr;
            };
            
            // 根据ID遍历查找实体
            var selectentitybyid = function(_id){
                if(_id > 0){
                    for(var i in options.data){
                        if(options.data[i][options.ItemId] == _id){
                            return options.data[i];
                        }
                    }
                }
            }
            
            init();
            if(options.callback && typeof(options.callback) == 'function') {
                options.callback(_this);
            }
            return options;
        }
    });
})(jQuery);
