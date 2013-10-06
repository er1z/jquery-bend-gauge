/**
 * jQuery Bend Gauge
 * A simple circular value indicator written in RaphaelJS.
 *
 * Created by eRIZ - http://przemyslaw.pawliczuk.pl
 * Brought by h2p.pl
 */
(function($){

    $.fn.bendGauge = function(){

        // todo: change options at runtime (especially bands num, colors and glows)
        // todo: name anonymous callbacks
        // todo: names of private functions
        // todo: validate jsdoc

        /**
         * default options for construction
         *
         * - duration: animation time in ms
         * - delayFactor: DF*duration pause for each bend enabling/disabling
         * - disabledColor: color of disabled bend
         * - fillColor: color of enabled bend
         * - glow: false or array of glows (see Raphael's documentation)
         * - easing: Raphael's easing function used in animations
         * - queue: internal queue name. Can be "fx" if you want to sync with jQuery's animation queue
         * @type {{duration: number}}
         */
        var defaultOptions = {
            duration: 200,
            delayFactor: 1/3,
            disabledColor: 'rgba(0,0,0,.6)',
            fillColor: 'rgba(255,255,255,0.8)',
            glow: [
                {
                    width: 10,
                    opacity: 0.7,
                    color: '#D30000'
                },
                {
                    width: 3,
                    opacity: 0.7,
                    color: '#D07872'
                }
            ],
            easing: 'linear',
            queue: 'jquery-bend-gauge'
        };

        var args = arguments;


        /**
         * an instance
         * @param $obj {jQuery}
         * @param params {{}}
         * @returns {Function}
         */
        var gauge = function($obj, params){

            /**
             * instance processed options
             * @type {{}}
             */
            var options = {};

            /**
             * alias to main object
             * @type {*}
             */
            var that = this;

            /**
             * current node value
             * @type {number}
             */
            $obj.value = 0;

            /**
             * used to detect what queue value should be used
             * @type {number}
             */
            var nextValue = 0;

            /**
             * Raphael's paper handle
             * @type {Raphael}
             */
            var paper;

            /**
             * bends buffer
             * @type {Array}
             */
            var set = [];

            /**
             * matrix of rotated elements
             * @type {Array}
             */
            var rotationMatrix = [];

            /**
             * matrix of flashed elements
             * @type {Array}
             */
            var flashMatrix = [];

            /**
             * used to determine if call queue is currently running
             * @type {boolean}
             */
            var queueInProgress = false;

            /**
             * enqueue a function into queue
             * @param {undefined|Function} callback
             * @see {jQuery.fn.queue}
             * @returns {Array}
             */
            var queue = function(callback){
                var result = $obj.queue(options.queue, callback);
                var q = result.queue(options.queue);

                return q;
            };

            /**
             * pop a callback from queue and execute
             * @returns {jQuery}
             */
            var dequeue = function(){

                // we're processing a queue
                queueInProgress = true;

                // get current queue elements
                var q = $obj.queue(options.queue);
                // strip out first call
                var result = $obj.dequeue(options.queue);

                // if nothing left, it's a end of queue, so change the flag
                if(!q.length){
                    queueInProgress = false;
                }
                return result;
            };

            /**
             * initialize bends
             * @param dim {Number} the lowest dimension of containing object
             * @private
             */
            var _initializeBends = function(dim){
                // this will be definitely refactored (to use various banding number, not predefined ones)

                // draw bends
                var src = paper.set([
                    paper.path('M88.456,32.269c-6.326-4.116-13.644-6.499-21.163-6.89l0.521-9.986c9.274,0.482,18.301,3.421,26.099,8.496   L88.456,32.269z'),
                    paper.path('M105.222,52.99c-2.693-7.062-7.231-13.312-13.123-18.074l6.287-7.777 c7.263,5.871,12.856,13.578,16.18,22.287L105.222,52.99z'),
                    paper.path('M116.263,82.121l-9.659-2.589c1.946-7.271,1.944-14.979-0.007-22.291l9.662-2.578   C118.662,63.665,118.663,73.16,116.263,82.121z'),
                    paper.path('M98.38,109.634l-6.294-7.771c2.915-2.36,5.522-5.112,7.751-8.18c2.224-3.062,4.032-6.386,5.377-9.882   l9.334,3.59c-1.658,4.311-3.885,8.404-6.621,12.17C105.187,103.335,101.974,106.724,98.38,109.634z'),
                    paper.path('M67.736,121.364l-0.521-9.985c7.57-0.396,14.915-2.771,21.238-6.875l5.443,8.39   C86.102,117.949,77.055,120.878,67.736,121.364z'),
                    paper.path('M62.198,121.364c-9.299-0.485-18.342-3.435-26.152-8.53l5.464-8.375c6.335,4.133,13.669,6.525,21.209,6.92   L62.198,121.364z'),
                    paper.path('M31.574,109.578c-7.233-5.861-12.81-13.55-16.125-22.236l9.343-3.566c2.688,7.044,7.21,13.279,13.077,18.031  L31.574,109.578z'),
                    paper.path('M13.747,82.073c-2.402-9.01-2.397-18.512,0.012-27.479l9.657,2.596c-1.956,7.275-1.958,14.987-0.007,22.308  L13.747,82.073z'),
                    paper.path('M24.809,52.92l-9.331-3.596c1.654-4.293,3.877-8.375,6.604-12.131c2.747-3.78,5.965-7.174,9.564-10.086  l6.29,7.773c-2.919,2.362-5.532,5.118-7.765,8.19C27.955,46.123,26.151,49.437,24.809,52.92z'),
                    paper.path('M41.572,32.244l-5.438-8.393c7.791-5.048,16.83-7.974,26.143-8.459l0.52,9.987  C55.233,25.773,47.894,28.147,41.572,32.244z')
                ]);

                // original bends are created using predefined SVG paths - set scaling factor to fit parent node
                var factor = dim/130;

                // make some enhancements
                src.forEach(function(e){

                    // colorize disabled bend
                    e.attr({
                        'fill': options.disabledColor,
                        'stroke': 'none'
                    });

                    // scale it if necessary. If we specify 0,0 as cx+cy then we haven't to care about moving
                    if(dim!=130){
                        e.transform(
                            'S'+factor+','+factor+',0,0'
                        );
                    }

                    // oh, glows should be definitely in front of lamp
                    e.toBack();

                    // prepare glowing if specified
                    var glow = paper.set();

                    // iterate over glows definitions
                    if(options.glow){
                        for(var i in options.glow){
                            glow.push(
                                e.glow(options.glow[i])
                            );
                        }
                    }

                    // hide glows because the lamp is turned off
                    glow.attr('stroke-opacity', 0);

                    // combine a lamp with its glows
                    var tmp = paper.set(e,glow);
                    tmp.state = false;

                    set.push(tmp);
                });
            };

            /**
             * create hook within jQuery to handle val([number]) callback
             * @private
             */
            var _hookVal = function(){
                $.valHooks['jquery-bend-gauge'] = {
                    get: that.value,
                    set: function(context,val){
                        that.value(val);
                    }
                };

                // we have to pass this attribute directly to the DOM node
                $($obj)[0].type = 'jquery-bend-gauge';
            };

            /**
             * constructor
             * @private
             */
            var _construct = function(){
                // setup options if specified
                that.options(params[0]);

                // initialize Raphael's paper
                paper = Raphael($obj[0]);

                // determine smaller dimension
                var width = $obj.width();
                var height = $obj.height();
                var dim = width<height ? width : height;

                _initializeBends(dim);
                _hookVal();
            };

            /**
             * get on/off bends array specified by true/false
             * @returns {Array}
             */
            this.getMatrix = function(){
                var ret = [];
                // based on state. simply
                for(var i=0;i<10;i++){
                    ret.push(
                        set[i].state
                    )
                }

                return ret;
            };

            /**
             * set bends state using matrix
             * @param idxs {Array}
             * @param callback {undefined|Function}
             */
            this.setMatrix = function(idxs, callback){

                var ret = [];

                for(var i=0;i<idxs.length;i++){
                    idxs[i] && ret.push(i);
                }

                that.set(ret, callback);

            };

            /**
             * append callback to the queue
             * @param callback
             */
            this.callback = function(callback){

                var end = function call(){
                    $.isFunction(callback) ?  callback.call($obj) : null;
                    dequeue();
                };

                queue(end);

                !queueInProgress && dequeue();
            };

            /**
             * turn on particular bend
             * @param idx {Number} index of the light
             * @param callback {undefined|Function} callback when finished
             * @private
             */
            var _on = function(idx, callback){
                set[idx][0].animate({
                    'fill': options.fillColor
                }, options.duration, options.easing, callback);

                set[idx][1].animate({
                    'stroke-opacity': 1
                }, options.duration, options.easing);

                set[idx].state = true;
            };

            /**
             * turn off particular bend
             * @param idx {Number} light index
             * @param callback {undefined|Function} callback
             * @private
             */
            var _off = function(idx, callback){
                set[idx][0].animate({
                    fill: options.disabledColor
                }, options.duration, options.easing, callback);

                set[idx][1].animate({
                    'stroke-opacity': 0
                }, options.duration, options.easing);

                set[idx].state = false;
            }

            /**
             * @see _on
             * @param idx
             * @param callback
             */
            this.on = function(idx, callback){
                queue(function(){
                    _on(idx);
                });
                that.callback(callback);
            };

            /**
             * @see _off
             * @param idx
             * @param callback
             */
            this.off = function(idx, callback){
                queue(function(){
                    _off(idx);
                });
                that.callback(callback);
            };

            /**
             * set plugin instance options
             * @see _defaultOptions
             * @param opts {{}}
             */
            this.options = function(opts){
                options = $.extend(defaultOptions, opts);
            };

            /**
             * set state using enabled-indexes array eg. [1,2,6]
             * @param idxs
             * @param callback
             */
            this.set = function(idxs, callback){

                // this function may be used within val() callback, so determine it
                if(!idxs || idxs.constructor!=[].constructor){
                    that.callback(callback);
                    return;
                }

                // reset value on changing particular elements
                $obj.value = -1;

                // enabled bends array
                var enabled = {};

                // enqueue correct functions
                queue(function(){

                    // flag to determine if we have put a dequeue on animation end
                    var executed = false;

                    // turn on specified keys
                    for(var i=0;i<idxs.length;i++){
                        _on(idxs[i], !executed ? dequeue : null);
                        enabled[idxs[i]] = true;
                        executed = true;
                    };

                    // and disable for missing indexes
                    for(var i=0;i<10;i++){
                        if(!enabled[i]){
                            _off(i, !executed ? dequeue : null);
                            executed = true;
                        }
                    };
                });

                // execute callback
                that.callback(callback);
            };

            /**
             * return indexes of enabled bends
             * @returns {Array}
             */
            this.get = function(){
                var ret = [];
                for(var i=0;i<10;i++){
                    set[i].state && ret.push(i);
                }
                return ret;
            };

            /**
             * clear all bends
             * @param callback {Function}
             */
            this.clear = function(callback){
                that.set([]);
                that.callback(callback);
            };

            /**
             * sets a value-based indicators - starting at 12 o'clock
             * @param val {Number}
             * @param callback {Function}
             */
            this.value = function(val, callback){

                // jQuery's hook call
                if(typeof val == 'object'){
                    return $obj.value;
                }

                // currently processed node index for timeout calculations
                var counter = 0;

                // if animation mode used, reset value
                if($obj.value<0){
                    $obj.value = 0;
                    nextValue = 0;
                }

                /**
                 * timeout setter and encapsulator
                 * @param i {Number} index
                 * @param func {Function} additional callback on bend start
                 * @param last {Boolean} is it the last timeout set
                 */
                var exec = function(i, func, last){

                    setTimeout(function(){
                        if(last){
                            $obj.value = val;
                        }else{
                            // in case user will stop
                            if($obj.value<val){
                                $obj.value++;
                            }else if($obj.value>val){
                                $obj.value--;
                            }
                        }
                        func(i-1, last);
                    }, counter*(options.duration*options.delayFactor));
                };

                // the same value, do nothing
                if(val==nextValue || val>10 || val<0){
                    return;
                // specified value higher than current
                }else if(val>nextValue){
                    /**
                     * construction used to copy some variables and make them context-independent
                     */
                    (function(value,val){
                        queue(function(next){
                            for(var i=value+1; i<=val; i++, counter++){
                                exec(i,_on,i==val ? next : null);
                            }
                        });
                    })(nextValue, val);
                }else{
                    /**
                     * construction used to copy some variables and make them context-independent
                     */
                    (function(value, val){
                        queue(function(next){
                            for(var i=value; i>val; i--, counter++){
                                exec(i,_off,i==val+1 ? next : null);
                            }

                        });
                    })(nextValue, val);
                }

                // useful for chaining - $obj.value is not assigned until the bend is light up
                nextValue = val;

                // execute callback
                that.callback(callback);
            };

            /**
             * flash enabled lights N times or start till the stop
             * @param times {Boolean|Number} flash N times if number; otherwise - (false) start flashing
             * @param callback {Function}
             */
            this.flash = function(times, callback){

                // setup amount to always be a number
                var amount = !!times ? times : 1;

                // get current enabled state indexes
                flashMatrix = rotationMatrix.length>0 ? rotationMatrix : that.getMatrix();
                // prepare clearing matrix
                var empty = [0,0,0,0,0,0,0,0,0,0];

                // store current value to use it after setMatrix completes
                nextValue = $obj.value;

                // append jobs to the queue
                while(amount--){
                    that.setMatrix(empty);
                    that.setMatrix(flashMatrix);
                }

                // restore old value
                that.callback(function(){
                    $obj.value = nextValue;
                    // infinite
                    if(!times){
                        that.flash(times, callback);
                    }else{
                        flashMatrix = [];
                    }
                });

                // callback if the number of flashes is finite
                !!times && that.callback(callback);

            }

            /**
             * rotate enabled bends by {{amount}} steps
             *
             * if amount == null/0 && !isNaN(callbackOrDirection), infinite rotator
             * @param amount {null|Number} how many bends rotate; amount>0 - clockwise; amount<0 - counterclockwise
             *               if empty - callbackOrDirection's value determines rotation direction
             * @param callbackOrDirection
             */
            this.rotate = function(amount, callbackOrDirection){

                // no value since now
                $obj.value = -1;

                /**
                 * rotate one bend left
                 */
                var rotateLeft = function(){
                    // get matrix if needed
                    if(rotationMatrix.length==0){
                        rotationMatrix = that.getMatrix();
                    }

                    // shift it one left
                    rotationMatrix.push(rotationMatrix.shift());

                    that.setMatrix(rotationMatrix);
                };

                /**
                 * rotate one bend right
                 */
                var rotateRight = function(){
                    // get matrix
                    if(rotationMatrix.length==0){
                        rotationMatrix = that.getMatrix();
                    }

                    // shift one right
                    rotationMatrix.unshift(rotationMatrix.pop());
                    that.setMatrix(rotationMatrix);
                };

                // if infinite
                if(!amount){
                    // determine direction
                    if(callbackOrDirection<0){
                        rotateLeft();
                    }else if(callbackOrDirection>0){
                        rotateRight();
                    }

                    // and go dancing
                    that.callback(function(){
                        that.rotate(amount, callbackOrDirection);
                    });
                // counterclockwise
                }else if(amount<0){
                    while(amount++<0){
                        rotateLeft();
                    }
                // clockwise
                }else if(amount>0){
                    while(amount-->0){
                        rotateRight();
                    }
                }

                // internal callback - reset helper fields and run callback
                !!amount && that.callback(function(){
                    rotationMatrix = [];
                    callbackOrDirection && callbackOrDirection();
                });
                !queueInProgress && dequeue();
            };

            /**
             * clear queue animation
             */
            this.stop = function(){
                // clear queue
                $($obj).clearQueue(options.queue);

                /**
                 * helper job to clear some variables
                 */
                queue(function(){
                    // clear rotation matrix
                    rotationMatrix = [];

                    // flashing not finished?
                    if(flashMatrix.length>0){
                        that.setMatrix(flashMatrix);
                        // restore old value
                        that.callback(function(){
                            $obj.value = nextValue;
                        });
                        flashMatrix = [];
                    }

                    dequeue();
                });
                dequeue();
            }

            // fire constructor
            _construct();

            return this;
        };

        // a proxy for the value - it could be a val(), for example
        var result = $(this);

        // for all fetched nodes
        $(this).each(function(){
            // save reference to the obj
            var $obj = $(this);
            var klass = $obj.data('vector-gauge');

            var params = Array.prototype.slice.call(args, 0);

            // instantiate if needed
            if(!klass){
                klass = new gauge($(this), args);
                $(this).data('vector-gauge', klass);
            }

            // we have a method name
            if(typeof params[0] == 'string'){
                if(klass[params[0]]){
                    var value = klass[params[0]].apply(this, params.slice(1));
                    if(value){
                        result = value;
                    }
                }

            // just options
            }else if (params[0]!=null && typeof params[0]=='object'){
                klass.options(params[0]);
            };

        });

        return result;

    };


})(jQuery);