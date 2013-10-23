(function( scope ) {

    /**
     *
     * M.View inherits from Backbone.View
     *
     * @type {*}
     */
    M.View = Backbone.View.extend({

        /**
         * The View type
         */
        _type: 'M.View',

        /*
         * define a user template
         */
        template: null,

        /*
         * define a template based on the tmpl template engine
         */
        _template: _.tmpl(M.TemplateManager.get('M.View')),

        /**
         * use this property to define which data are given to the template
         */
        _templateData: null,


        /**
         * extend the default template with this one. It gets injected into the <%= _value_ %> placeholder
         */
        templateExtend: null,

        /**
         * Constructor
         * @returns {*}
         */

        /**
         * The Value of the view
         */
        _value_: null,

        _setModel: function( value ) {
            this.model = value;
            return this;
        },

        _getModel: function() {
            return this.model;
        },

        getPropertyValue: function( propertyString, data ) {
            var o = data;
            _.each(propertyString.split('.'), function( key ) {
                if( o[key] ) {
                    o = o[key];
                } else if( M.isModel(o) || M.isCollection(o) ) {
                    //o = o.get(key);
                    o = {
                        model: o,
                        attribute: key
                    }
                } else {
                    o = null;
                }
            });
            return o;
        },

        constructor: function( options ) {
            this.cid = _.uniqueId('view');
            options || (options = {});
            var viewOptions = ['scope', 'model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];
            _.extend(this, _.pick(options, viewOptions));
            this._ensureElement();
            this.initialize.apply(this, arguments);
            this.delegateEvents();
        },

        initialize: function( options ) {

            this._assignValue(options);
            this._assignTemplateValues();
            this._mapEvents(this.scope);
            this._assignContentBinding();

            //            this._assignComplexView();
            //            this.init();
            return this;
        },

        _assignValue: function( options ) {
            //don't write _value_ in the view definition - write value and here it gets assigned
            if( this.value ) {
                this._value_ = this.value;
            } else if( this.scopeKey ) {
                this._value_ = this.getPropertyValue(this.scopeKey, this.scope);
            } else if( options && options.value ) {
                this._value_ = options.value;
            }

            if( this._value_ && M.isModel(this._value_.model) ) {
                this.model = this._value_.model;
            } else if( this._value_ && M.isModel(this._value_) ) {
                this.model = this._value_;
            } else if( M.isCollection(this._value_) ) {
                this.collection = this._value_;
            }
            return this;
        },

        _assignTemplateValues: function() {

            if( this.model ) {
                if( M.isModel(this._value_) ) {
                    this._templateData = this.model.attributes;
                } else {
                    this._templateData = {};
                    this._templateData['_value_'] = this.model.get(this._value_.attribute);
                }
            } else if( this._value_ ) {
                this._templateData = {};
                this._templateData['_value_'] = this._value_;
            }
        },

        _assignContentBinding: function() {
            var that = this;
            if( this.scopeKey && M.isModel(this._value_) ) {

                this.listenTo(this.scope, this.scopeKey, function( model ) {
                    that._setModel(model);
                    that.render();
                });
            } else if( this.scopeKey && this._value_ && M.isModel(this._value_.model) && this._value_.attribute ) {

                this.listenTo(this.scope, this.scopeKey.split('.')[0], function( model ) {
                    //                    that._value_.model.set(that._value_.attribute, model.get(that._value_.attribute));
                });
            }
            return this;
        },

        _mapEvents: function( scope ) {
            if( this.events ) {
                var events = [];
                _.each(this.events, function( value, key ) {
                    if( typeof value === 'string' ) {
                        if( scope && typeof scope[value] === 'function' ) {
                            events[key] = scope[value];
                        }
                    }
                }, this);
                if( events != [] ) {
                    this.events = _.extend(this.events, events);
                }

            }
        },

        /**
         * implement render function
         * @returns {this}
         */
        render: function() {
            //this._assignValue();
            this._preRender();
            this._render();
            this._renderChildViews();
            this._postRender();
            return this;
        },

        _preRender: function() {
            this._assignTemplate();
            this._extendTemplate();
            this.preRender();
            return this;
        },

        _assignTemplate: function( template ) {
            var template = template || this.template;
            if( template ) {
                if( typeof template === 'function' ) {
                    this._template = template;

                } else if( _.isString(template) ) {
                    this._template = _.tmpl(template);
                } else if( _.isObject(template) ) {
                    this._template = _.tmpl(M.TemplateManager.get.apply(this, ['template']))
                }
            }
            return this;
        },

        _extendTemplate: function() {
            if( this.extendTemplate ) {
                this._template = _.tmpl(this._template({_value_: this.extendTemplate}));
            }
        },

        preRender: function() {

        },

        _render: function() {
//            this.$el.html(this._template(this._templateData));
//            return this;
            var dom = this._template(this._templateData);
            this.setElement(dom);
            return this;
        },

        _renderChildViews: function() {

            if( !this.childViews ) {
                return;
                //this.childViews = this._getChildViews();
            }
            _.each(this.childViews, function( child, name ) {
                var dom = this.$el;
//                if( this.$el.find('[data-childviews="' + this.cid + '_' + name + '"]').addBack().length ) {
//                    dom = this.$el.find('[data-childviews="' + this.cid + '_' + name + '"]').addBack();
//                }
                if( this.$el.find('[data-childviews="' + name + '"]').length ) {
                    dom = this.$el.find('[data-childviews="' + name + '"]');
                }

                if( typeof child['render'] === 'function' ) {
                    dom.append(child.render().$el);
                    child.delegateEvents();
                } else if( _.isArray(child) ) {
                    _.each(child, function( c ) {
                        dom.append(c.render().$el);
                        c.delegateEvents();
                    })
                }

            }, this);

            return this;
        },

        _postRender: function() {
            if( this.model ) {
                this._assignBinding();
                this.stickit();
            } else {

            }
            this.postRender();
            return this;
        },

        _assignBinding: function() {
            var bindings = {};
            var data = this._templateData;

            if( this.model && !M.isModel(this._value_) ) {
                var selector = '[data-binding="_value_"]';
                bindings[selector] = {observe: '' + this._value_.attribute};
            } else if( this.model && M.isModel(this._value_) ) {
                _.each(this.model.attributes, function( value, key ) {
                    var selector = '[data-binding="' + key + '"]';
                    bindings[selector] = {observe: '' + key};
                }, this);
            } else if( this.templateExtend === null && this.scopeKey ) {
                var selector = '[data-binding="_value_"]';
                bindings[selector] = {observe: '' + this.scopeKey};
            } else {
                _.each(this._templateData, function( value, key ) {
                    var selector = '[data-binding="' + key + '"]';
                    bindings[selector] = {observe: '' + key};
                }, this);
            }

            this.bindings = bindings;

            return this;
        },

        postRender: function() {

        },

        updateTemplate: function() {
            var template = this.template || M.TemplateManager.get(this._type);
            this._assignTemplate(template);
            this._updateChildViewsTemplate();
            return this;
        },

        _updateChildViewsTemplate: function() {

            if( !this.childViews ) {
                return;
            }
            _.each(this.childViews, function( child, name ) {
                if( typeof child['updateTemplate'] === 'function' ) {
                    child.updateTemplate();
                } else if( _.isArray(child) ) {
                    _.each(child, function( c ) {
                        c.updateTemplate();
                    });
                }

            }, this);
            return this;
        },

        addChildView: function(selector, view){
            this.childViews[selector] = view;
        }

    });

    /**
     * extend the Backbone.View extend function with a childViews parameter
     * @param options
     * @param childViews
     * @returns {*}
     */
    M.View.extend = function( options, childViews ) {
        options = options || {};
        options._childViews = childViews || {};
        return Backbone.View.extend.apply(this, [options]);
    };

    /**
     *
     * @param scope
     * @returns {this}
     */
    M.View.design = function( scope, childViews, isScope ) {
        var _scope = isScope ? {scope: scope} : scope;
        var f = new this(_scope);
        if( f._childViews ) {
            f.childViews = {};
            _.each(f._childViews, function( childView, name ) {
                f.childViews[name] = childView.design(scope, null, true);
            });
        }
        if( childViews ) {
            f.childViews = f.childViews || {};
            _.each(childViews, function( childView, name ) {
                f.childViews[name] = childView;
            });
        }
        return f;
    };

})(this);