;(function ($, _, window, document, undefined) {
    "use strict";

    var StateProvider = function( options ) {
        options = _({}).extend(options);
        this.state = _({}).extend(options.initial_state);    
    };
    
    _.extend(StateProvider.prototype, {
        get: function( key, default_value ) {
            return _(this.state[key]).isUndefined() ? default_value : this.state[key];     
        },
        
        set: function( key, value ) {
            var new_value = JSON.stringify(value);
            var old_value = JSON.stringify(this.get(key));
            
            if( old_value != new_value ) {
                this.state[key] = value;
                console.log("state:update",key,value);
                $(this).trigger('state:update', [key, value]);
            }
        },
        
        remove: function( key ) {
            delete this.state[ key ];
            console.log("state:remove",key);
            $(this).trigger('state:remove', [key] );
        },
        
        clear: function() {
        }
    });
    
    window.StateProvider = StateProvider;
    
    var AjaxStateProvider = function( options ) {
        options = _({delay: 500}).extend(options);
        this.parent.constructor.call(this,options);
        this.ajax = options.ajax;

        this.queue = { update: {}, remove: {} };
        
        $(this).on('state:update', this.queue_update);
        $(this).on('state:remove', this.queue_remove);
        
        this.submit_state = _.debounce(function(){
            if( ! this.ajax.url )
                return;

            var queue = $.extend(true,{},this.queue);
            this.queue = { update: {}, clear: {} };
            
            $.ajax(
                _.extend(this.ajax, { 
                    data: JSON.stringify(queue),
                    contentType: "application/json; charset=utf-8",
                    dataType: 'json',
                    type: 'POST'
                })
            );
        },options.delay);
    };
    
    AjaxStateProvider.prototype = new StateProvider;
    
    _.extend(AjaxStateProvider.prototype, {
        constructor: AjaxStateProvider,
        parent: StateProvider.prototype,
        
        queue_update: function( event, key, value ) {
            this.queue.update[key] = value;
            this.submit_state();
        },
        
        queue_remove: function( event, key ) {
            delete this.queue.update[key];
            this.queue.remove[key] = true;
            this.submit_state();
        }
    });
    
    window.AjaxStateProvider = AjaxStateProvider;
    
    window.store = function() {
        var provider = new StateProvider();
        
        return {
            set_provider: function( new_provider ) {
                provider = new_provider;
            },

            get_provider: function( ) {
                return provider;
            },
            
            get : function( key, default_value ) {
                return provider.get(key,default_value);
            },
            
            set : function( key, value ) {
                if( (_(value).isObject() || _(value).isString()) && _(value).isEmpty() ) {
                    provider.remove(key);                    
                } else {
                    provider.set(key,value);
                }
                return this;
            },

            remove : function( key ) {
                provider.remove( key );
            },

            clear : function() {
                provider.clear();
            }
            
            //,getAll : function() {
            //    
            //}
            //
            //,forEach: function( callback ) {
            //    
            //}
        }
    }();
    
}(jQuery, _, window, document));
