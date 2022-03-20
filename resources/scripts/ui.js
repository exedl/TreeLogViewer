class UI {
    static printDir(title, nesting, id = 0, parent = 0, line = 0) {
        var print_to = '.all-files';
        if (parent > 0) 
            print_to += ' .folder[data-id="' + parent + '"]';
    
        var html = `<div class="row folder" data-id="${id}" data-name="${encodeURIComponent(JSON.stringify({name: title}))}" data-parent="${parent}" data-line="${line}" data-nesting="${nesting}" style="padding-left: ${nesting*30}px; ${((nesting > 1) && (parent == 0)) ? 'display: none;' : ''}">
                        <div class="control">
                            <i class="bi bi-chevron-right"></i>
                        </div>
    
                        <div class="text">
                            <i class="bi bi-folder-fill"></i> ${title}
                        </div>
                    </div>`;
    
        if (parent > 0) {
            $(print_to).after(html);
        } else {
            $(print_to).append(html);
        }
    }

    static printFile(title, nesting, id = 0, parent = 0) {
        if (Number.isInteger(title))
            return;
    
        var print_to = '.all-files';
        if (parent > 0) 
            print_to += ' .folder[data-id="' + parent + '"]';
    
        var html = `<div class="row txt" data-id="${id}" data-parent="${parent}" style="padding-left: ${nesting*30}px; ${((nesting > 1) && (parent == 0)) ? 'display: none;' : ''}">
                        <div class="text">
                            <i class="bi ${BootstrapExt.getExt(title)}"></i> ${title}
                        </div>
                    </div>`;
        
        if (parent > 0) {
            $(print_to).after(html);
        } else {
            $(print_to).append(html);
        }
    }

    static print(data, nesting = 1, parent = 0) {
        for (var el in data) {
            var id = Math.round(Math.random()*10000000000);
    
            if (Array.isArray(data[el])) {
                this.printDir(el, nesting, id, parent, data[el][0]);
                this.print(data[el], nesting+1, id);
            } else {
                this.printFile(data[el], nesting, id, parent);
            }
        }
    }

    static printSubDir(message) {
        var data = message.dir;
        var nesting = message.nesting;
        var parent = message.parent_id;
    
        for (var el in data) {
            var id = Math.round(Math.random()*10000000000);
    
            if (Array.isArray(data[el])) {
                this.printDir(el, nesting, id, parent, data[el][0]);
            } else {
                this.printFile(data[el], nesting, id, parent);
            }
        }
    }

    static printSearchResults(data) {
        var search = $('input[name="search"]').val();
    
        for (var i in data) {
            data[i].path_short = (data[i].path.length > 38 ? data[i].path.replace(/^(.*?)(.{36})$/, '..$2') : data[i].path);
            data[i].path_arr = data[i].path_short.split('/').reverse();
            data[i].path_arr[0] = data[i].path_arr[0].replace(new RegExp('^(.*?)(' + search + ')(.*?)$', 'i'), '$1<b>$2</b>$3');
            data[i].path_short = data[i].path_arr.reverse().join('/');
    
            if (data[i].type === 'folder') {
                var html = `<div class="row folder search-result">
                        <div class="text">
                            <i class="bi bi-folder-fill"></i> ${data[i].path_short}
                        </div>
                    </div>`;
            } else {
                var html = `<div class="row txt search-result">
                        <div class="text">
                            <i class="bi ${BootstrapExt.getExt(data[i].path)}"></i> ${data[i].path_short}
                        </div>
                    </div>`;
            }
    
            $('.row.search').after(html);
        }
    }

    static closeAllSub(id) {
        if ($('[data-parent="' + id + '"]').length == 0)
            return;

        $('[data-parent="' + id + '"]').removeClass('opened').hide();
        
        for (var i=0; i<$('[data-parent="' + id + '"]').length; i++) {
            this.closeAllSub(
                $('[data-parent="' + id + '"]').eq(i).data('id')
            )
        }
    }
}