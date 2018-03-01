// sprites.js library by Lubomir Salanci
// version 4. 11. 2016

var sprites = [];

var canvas, context,
    onPaintBackground = null, onPaintForeground = null;

var onClick = null,
    onDragTake = null, onDragMove = null, onDragDrop = null;

// Sprite class:

function Sprite(filenames, x, y, behavior)
{
    var i;
    this.idx = sprites.length;
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;
    this.place = null;
    this.item = null;
    this.image = null;
    this.images = [];
    this.highlight = null;
    this.behavior = behavior;
    sprites.push(this);
    if (!(filenames instanceof Array)) loadSpriteImage(this, 0, filenames);
    else
        for (i = 0; i < filenames.length; i++)
            loadSpriteImage(this, i, filenames[i]);
}

Sprite.prototype.saveState = function()
{
    var i, state;
    state = "";
    if (this.item instanceof Array || this.place != null && this.place.item instanceof Array)
    {
        if (this.x != this.homeX) state = state + " x = " + this.x.toString() + ";";
        if (this.y != this.homeY) state = state + " y = " + this.y.toString() + ";";
    }
    if (this.image != this.images[0])
        state = state + " img = " + this.images.indexOf(this.image).toString() + ";";
    if (this.highlight != null)
        state = state + " highlight = " + this.highlight + ";";
    if (this.item != null)
        if (!(this.item instanceof Array)) state = state + " item = " + this.item.idx.toString();
        else
        {
            state = state + " item = [";
            if (this.item.length > 0)
            {
                state = state + this.item[0].idx.toString();
                for (i = 1; i < this.item.length; i++)
                    state = state + ", " + this.item[i].idx.toString();
            }
            state = state + "];";
        }
    return state;
}

Sprite.prototype.loadState = function(state)
{
    var settings, namevalue, ids, sprite;
    var i, s,n;
    settings = state.split(";");
    for (s = 0; s < settings.length; s++)
    {
        namevalue = settings[s].split("=");
        if (namevalue.length >= 2)
            switch (namevalue[0].trim())
            {
                case "x":
                    this.x = parseInt(namevalue[1]);
                    break;
                case "y":
                    this.y = parseInt(namevalue[1]);
                    break;
                case "img":
                    this.image = this.images[parseInt(namevalue[1])];
                    break;
                case "highlight":
                    this.highlight = namevalue[1];
                    break;
                case "item":
                    ids = namevalue[1].trim();
                    if (ids != "")
                        if (ids[0] != "[" || ids[ids.length - 1] != "]")
                        {
                            sprite = sprites[parseInt(ids)];
                            this.item = sprite;
                            sprite.place = this;
                        }
                        else
                        {
                            ids = ids.substring(1, ids.length - 1).split(",");
                            this.item = [];
                            for (i = 0; i < ids.length; i++)
                                if (ids[i] != "")
                                {
                                    sprite = sprites[parseInt(ids[i])];
                                    this.item.push(sprite);
                                    sprite.place = this;
                                }
                        }
                    break;
            }
    }
}

Sprite.prototype.erase = function()
{
    var i;
    i = sprites.indexOf(this);
    if (i >= 0) sprites.splice(i, 1);
    if (clicking == this) clicking = null;
    if (dragging == this) dragging = null;
    if (this.place != null) 
    {
        if (!(this.place.item instanceof Array)) this.place.item = null;
        else this.place.item.splice(this.place.item.indexOf(this), 1);
        this.place = null;       
    }
    if (this.item != null)
    {
        if (!(this.item instanceof Array)) this.item.place = null;
        else
            for (i = 0; i < this.item.length; i++)
                this.item[i].place = null;
        this.item = null;
    }
}

Sprite.prototype.__defineGetter__("left", function()
{
    if (this.image == null) return this.x;
    else return this.x - Math.round(this.image.width / 2);
});

Sprite.prototype.__defineGetter__("top", function()
{
    if (this.image == null) return this.y;
    else return this.y - Math.round(this.image.height / 2);
});

Sprite.prototype.__defineGetter__("right", function()
{
    if (this.image == null) return this.x;
    else return this.x - Math.round(this.image.width / 2) + this.image.width;
});

Sprite.prototype.__defineGetter__("bottom", function()
{
    if (this.image == null) return this.y;
    else return this.y - Math.round(this.image.height / 2) + this.image.height;
});

Sprite.prototype.__defineGetter__("width", function()
{
    if (this.image == null) return 0;
    else return this.image.width;
});

Sprite.prototype.__defineGetter__("height", function()
{
    if (this.image == null) return 0;
    else return this.image.height;
});

Sprite.prototype.isIn = function(x, y)
{
    var l, t, r, b;
    if (this.image == null) return false;
    l = this.x - Math.round(this.image.width / 2);
    t = this.y - Math.round(this.image.height / 2);
    r = l + this.image.width;
    b = t + this.image.height;
    return l <= x && t <= y && x < r && y < b;
}

Sprite.prototype.isOverRect = function(x, y, w, h)
{
    return x <= this.x && y <= this.y && this.x < x + w && this.y < y + h;
}

Sprite.prototype.findOverlapped = function(list)
{
    var i, sprite;
    if (list === undefined) list = sprites;
    for (i = list.length - 1; i >= 0; i--)
    {
        sprite = list[i];
        if (sprite != this && sprite.isIn(this.x, this.y)) return sprite;
    }
    return null;
}

Sprite.prototype.bringToFront = function(behind = null)
{
    var i, j, n, m, s, order;
    if (behind == null && this.item == null)
    {
        if (sprites[sprites.length - 1] == this) return;
  	    i = sprites.indexOf(this);
	      if (i < 0) return;
	      sprites.splice(i, 1);
	      sprites.push(this);
	      return;
    }
    order = [];
    for (i = 0; i < sprites.length; i++)
    {
        s = sprites[i];
        while (s != null && s != this) s = s.place;
        if (s != null) s = sprites[i];
        order.push(s);
    }
    n = 0;
    i = 0;
    while (i < sprites.length && sprites[i] != behind)
    {
        if (order[i] == null)
        {
            sprites[n] = sprites[i];
            n++;
        }
        i++;
    }
    m = sprites.length - 1;
    j = sprites.length - 1;
    while (j >= i)
    {
        if (order[j] == null)
        {
            sprites[m] = sprites[j];
            m--;
        }
        j--;
    }
    for (i = 0; i < order.length; i++)
        if (order[i] != null)
        {
            sprites[n] = order[i];
            n++;
        }
}

Sprite.prototype.getFinalX = function()
{
    var m, p, w;
    if (this.place == null) return this.homeX;
    if (!(this.place.item instanceof Array)) return this.place.x;
    w = this.width;
    p = this.place.width;
    if (w >= p) return this.place.x;
    m = this.place.x - Math.round(p / 2) + Math.round(w / 2);
    if (this.x < m) return m;
    m = m + p - w;
    if (this.x > m) return m;
    return this.x;
}

Sprite.prototype.getFinalY = function()
{
    var m, p, h;
    if (this.place == null) return this.homeY;
    if (!(this.place.item instanceof Array)) return this.place.y;
    h = this.height;
    p = this.place.height;
    if (h >= p) return this.place.y;
    m = this.place.y - Math.round(p / 2) + Math.round(h / 2);
    if (this.y < m) return m;
    m = m + p - h;
    if (this.y > m) return m;
    return this.y;
}

Sprite.prototype.moveTo = function(x, y)
{
    var i, dx, dy;
    if (this.x == x && this.y == y) return;
    if (this.item == null)
    {
	      this.x = x;
	      this.y = y;
    }
    else
    {
	      dx = x - this.x;
	      dy = y - this.y;
        this.x = x;
        this.y = y;
        if (!(this.item instanceof Array)) this.item.moveTo(this.item.x + dx, this.item.y + dy);
        else                 
            for (i = 0; i < this.item.length; i++) 
                this.item[i].moveTo(this.item[i].x + dx, this.item[i].y + dy);
    }
}

Sprite.prototype.animate = function()
{
    var x, y;
    if (this == dragging) return false;
    x = this.getFinalX();
    y = this.getFinalY();
    function step(pos, final)
    {
        if (pos < final)
        {
            pos = Math.round((7 * pos + final) / 8);
            pos = pos + 1;
            if (pos > final) pos = final;
        
        }
        if (pos > final)
        {
            pos = Math.round((7 * pos + final) / 8);
            pos = pos - 1;
            if (pos < final) pos = final;
        }
        return pos;
    }  
    this.moveTo(step(this.x, x), step(this.y, y));
    return this.x != x || this.y != y;
}

Sprite.prototype.paint = function()
{
    var x, y;
    if (this.image == null) return;
    x = this.left;
    y = this.top;
    context.drawImage(this.image, x, y);
    if (this.highlight != null)
    {
        context.lineWidth = 2;
        context.strokeStyle = this.highlight;
        context.strokeRect(x - 1, y - 1, this.image.width + 2, this.image.height + 2);
    }
}

Sprite.prototype.test = function(mouseX, mouseY)
{
    var c, t;
    if (this.image == null || !this.isIn(mouseX, mouseY)) return false;
    c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    t = c.getContext("2d");
    t.drawImage(this.image, this.left - mouseX, this.top - mouseY);
    return t.getImageData(0, 0, 1, 1).data[3] > 0;
}

Sprite.prototype.setHome = function(homeX, homeY)
{
    if (homeX === undefined) this.homeX = this.x;
    else this.homeX = homeX;
    if (homeY === undefined) this.homeY = this.y; 
    else this.homeY = homeY;
}

Sprite.prototype.placeAt = function(target)
{
    var i;
    if (this.place != null) 
        if (!(this.place.item instanceof Array)) this.place.item = null;
        else this.place.item.splice(this.place.item.indexOf(this), 1);
    if (target != null) 
    {
        if (target.item != null) 
            if (!(target.item instanceof Array)) 
            {
                target.item.bringToFront(this);
                target.item.placeAt(this.place);
            }
            else
                for (i = 0; i < target.item.length; i++) 
                {
                    target.item[i].place = null;
                    target.item[i].bringToFront(this);
                }
        target.item = this;
        target.item.kind = this.kind;
    }
    this.place = target;
}

Sprite.prototype.placeInto = function(target)
{
    if (this.place != null)
        if (!(this.place.item instanceof Array)) this.place.item = null;
        else this.place.item.splice(this.place.item.indexOf(this), 1);
    if (target != null)
    {
        if (target.item == null) target.item = [];
        else 
            if (!(target.item instanceof Array)) target.item = [target.item];
        target.item.push(this);
    }
    this.place = target;
}

// Sprite behavior:

function clickSprite(sprite, x, y)
{
    if (clicking != null || dragging != null) performEnd();
    if (onClick != null) onClick(sprite);
    animate();
}

function dragSprite(sprite, x, y)
{
    if (clicking != null || dragging != null) performEnd();
    dragging = sprite;
    dragX = x;
    dragY = y;
    sprite.bringToFront();
    if (onDragTake != null) onDragTake(sprite);
    animate();
}

function clickDragSprite(sprite, x, y)
{
    if (clicking != null || dragging != null) performEnd();
    clicking = sprite;
    dragX = x;
    dragY = y;
    animate();
}

// sprite loader:

var loading = 0;

function loadSpriteImage(sprite, index, filename)
{
    var image;
    if (filename instanceof Image && filename.complete)
    {
        sprite.images[index] = filename;
        if (index == 0 && sprite.image == null) sprite.image = filename;
    } 
    else
    {
        image = new Image();
        image.crossOrigin = 'anonymous';
        function loaded()
        {
            loading--;
            if (loading == 0 && canvas != null) animate();
        }        
        image.onload = function(event)
        {
            sprite.images[index] = image;
            if (index == 0 && sprite.image == null) sprite.image = image;
            loaded();
        }
        image.onerror = function(event)
        {
            loaded();
            alert("Error loading image: " + event.target.src);
        }
        loading++;
        image.src = filename;
    }
}

// animation & painting:

var isAnimateRequest = false;

function animate()
{
    if (isAnimateRequest) return;
    isAnimateRequest = true;
    requestAnimationFrame(function()
    {
        var i, again;
        isAnimateRequest = false;
        again = false;
        for (i = 0; i < sprites.length; i++)
            if (sprites[i].animate()) again = true;
        paintSprites();
        if (again) animate();
    });
}

function paintSprites()
{
    var i;
    if (onPaintBackground != null) onPaintBackground();
    else
    {
        context.fillStyle="#FFFFFF";
        context.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (loading == 0)
        for (i = 0; i < sprites.length; i++)
            sprites[i].paint(canvas, context);
    if (onPaintForeground != null) onPaintForeground();
}

// state:

var initialState = "";

function saveState()
{
    var i, s, state;
    state = "";
    for (i = 0; i < sprites.length; i++)
    {
        s = sprites[i].saveState();
        if (s != "" || sprites[i].idx != i)
        {
            if (state != "") state = state + "|";
            state = state + "[" + i +"] = " + sprites[i].idx.toString();
            if (s != "") state = state + ":" + s;
        }
    }
    if (state == initialState) return "";
    else return state;
}

function loadState(state)
{
    var order;
    var line, id, sprite;
    var i, s, t;
    if (state === undefined || state == null || state == "") state = initialState;
    dragging = null;
    clicking = null;
    order = [];
    for (i = 0; i < sprites.length; i++) order[sprites[i].idx] = sprites[i];
    for (i = 0; i < sprites.length; i++)
    {
        sprite = order[i];
        sprites[i] = sprite;
        sprite.x = sprite.homeX;
        sprite.y = sprite.homeY;
        sprite.image = sprite.images[0];
        sprite.highlight = null;
        sprite.place = null;
        sprite.item = null;
    }   
    state = state.split("|");
    for (s = 0; s < state.length; s++)
    {
        line = state[s].split(":", 2);
        id = line[0].split("=", 2);
        if (id.length >= 2)
        {
            t = id[0].trim();
            i = parseInt(t.substring(1, t.length - 1));
            order[i] = sprites[parseInt(id[1])];
            if (line.length >= 2) order[i].loadState(line[1]);
        }
    }
    for (i = 0; i < order.length; i++)
    {
        sprite = order[i];
        sprite.moveTo(sprite.getFinalX(), sprite.getFinalY());
    }
    sprites = order;        
    animate();
}
          
// click, drag & drop:

var clicking = null, dragging = null;
var dragX = 0, dragY = 0;

function performStart(x, y)
{
    var i, rect;
    rect = canvas.getBoundingClientRect();
    x = x - rect.left;
    y = y - rect.top;
    if (clicking != null || dragging != null) performEnd();
    i = sprites.length - 1;
    while (i >= 0 && !sprites[i].test(x, y)) i--;
    if (i >= 0 && sprites[i].behavior) sprites[i].behavior(sprites[i], x, y);
    return clicking != null || dragging != null;
}

function performMove(x, y)
{
    var rect;
    rect = canvas.getBoundingClientRect();
    x = x - rect.left;
    y = y - rect.top;
    if (clicking != null)
    {
        if (Math.abs(x - dragX) > clicking.width / 4 || Math.abs(y - dragY) > clicking.height / 4)
        {
            dragging = clicking;
            clicking = null;
            dragging.bringToFront();
            if (onDragTake != null) onDragTake(dragging);
        }
    }
    if (dragging != null)
    {            
        dragging.moveTo(dragging.x + x - dragX, dragging.y + y - dragY);
        dragX = x;
        dragY = y;
        if (onDragMove != null) onDragMove(dragging)
    }
    animate();
    return clicking != null || dragging != null;
}

function performEnd()
{
    if (clicking != null) 
    {
        if (onClick != null) onClick(clicking);
        clicking = null;
        animate();
    }
    if (dragging != null) 
    {
        if (onDragDrop != null) onDragDrop(dragging);
        dragging = null;
        animate();
    }
}

// mouse events:

function mouseDown(event)
{
    if (loading != 0) return;
    performStart(event.clientX, event.clientY);
    // if (clicking != null || dragging != null) canvas.setCapture();
}

function mouseMove(event)
{
    if (loading != 0) return;
    if (clicking == null && dragging == null) return;
    rect = canvas.getBoundingClientRect();
    performMove(event.clientX, event.clientY);
    if (event.buttons == 0) performEnd();
}

function mouseUp(event)
{
    if (loading != 0) return;
    if (clicking != null || dragging != null) performEnd();
}

// touch events:

var touchFirstId = null;

function touchStart(event)
{
    var touch;
    if (loading != 0 || event.changedTouches.length != 1) return;
    touch = event.changedTouches[0];
    touchFirstId = touch.identifier;
    if (performStart(touch.clientX, touch.clientY)) event.preventDefault();
}

function touchMove(event)
{
    var i, touch;
    if (loading != 0) return;
    if (clicking == null && dragging == null) return;
    for (i = 0; i < event.changedTouches.length; i++)
    {
        touch = event.changedTouches[i];
        if (touch.identifier == touchFirstId)
            if (performMove(touch.clientX, touch.clientY)) event.preventDefault();
    }
}

function touchEndCancel(event)
{
    var i;
    if (loading != 0) return;
    if (clicking == null && dragging == null) return;
    for (i = 0; i < event.changedTouches.length; i++)
    {
        touch = event.changedTouches[i];
        if (touch.identifier == touchFirstId)
        {
            performEnd();
            touchFirstId = null;
        }
    }
}

// window events:

function windowResize()
{
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    paintSprites();
}

// main:

function initialize()
{
    canvas = document.getElementById("canvas");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    canvas.addEventListener("mousedown", mouseDown);
    canvas.addEventListener("mousemove", mouseMove);
    canvas.addEventListener("mouseup", mouseUp);
    canvas.addEventListener("touchstart", touchStart, false);
    canvas.addEventListener("touchmove", touchMove, false);
    canvas.addEventListener("touchend", touchEndCancel, false)
    canvas.addEventListener("touchcancel", touchEndCancel, false)
    context = canvas.getContext("2d");
    window.addEventListener("resize", windowResize, false);
    if (loading == 0) animate();
    initialState = saveState();
}

window.addEventListener("load", initialize, false);
