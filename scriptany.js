/*
 * ScriptAny: use any language with script tags.
 * Copyright (C) 2013 Joel Martin
 * Licensed underl MPL 2.0 (see LICENSE.MPL-2.0)
 */

var scriptany = function() {};
scriptany.handlers = {};
// Handlers take source text to evaluate for given script type
scriptany.register = function (type, handler) {
    this.handlers[type] = handler;
};
scriptany.handleScript = function (node) {
    if (node.tagName === "SCRIPT" &&
        !node.evaluated &&
        scriptany.handlers[node.type]) {

        var text = "";
        node.evaluated = true;
        if (node.src) {
            //console.log("handling " + node.type + " script tag with src:", node.src)
            var xhr = new XMLHttpRequest();
            xhr.onload = function () { text = this.responseText; };
            xhr.open("GET", node.src, false); // synchronous
            xhr.send();

        } else {
            //console.log("handling " + node.type + " script tag with innerHTML:", node.innerHTML)
            text = node.innerHTML;
        }
        scriptany.handlers[node.type](text);
    }
};
scriptany.barrier = function () {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
        scriptany.handleScript(scripts[i]);
    }
};
scriptany.init = function() {
    var Observer = window.WebKitMutationObserver ||
                window.MozMutationObserver ||
                window.MutationObserver ||
                null;

    function handleMutations (mutations) {
        //console.log('handleMutations length:', mutations.length);
        mutations.forEach(function(mutation) {
            for (var i = 0; i < mutation.addedNodes.length; i++) {
                var node = mutation.addedNodes[i];
                if (node.tagName === "SCRIPT") {
                    scriptany.handleScript(node);
                }
            }
        });
    }
    window.addEventListener("load", function() {
        if (Observer) {
            var observer1 = new Observer(handleMutations);
            var observer2 = new Observer(handleMutations);
            observer1.observe(document.head, { childList: true });
            observer2.observe(document.body, { childList: true });
        }
        scriptany.barrier();
    });

    /*
     * Implicit barriers before every (JavaScript) script is executed
     * Only supported by firefox currently.
     * WebKit bug: https://bugs.webkit.org/show_bug.cgi?id=91463
     * To workaround, call scriptany.barrier() directly at the top
     * scripts depend on definitions from earlier "scriptany" scripts.
     */
    document.addEventListener("beforescriptexecute", function (e) {
        //console.log("beforescriptexecute ID:", e.target.id);
        scriptany.barrier();
    }, true);
};
scriptany.init();
