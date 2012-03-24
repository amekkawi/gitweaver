;(function($, undefined){

var Git = function() {
	
};

$.extend(Git.prototype, {
	token: '',
	
	rateHandler: function(limit, remaining) { },
	
	repos: function(user, callback, params) {
		if ($.isFunction(user)) {
			params = callback;
			callback = user;
			user = undefined;
		}
		
		this._apiBase(
			user === undefined ? [ 'user/repos' ] : [ 'users', user, 'repos' ],
			callback, params
		);
	},
	
	repo: function(user, repo, callback) {
		this._apiBase([ 'repos', user, repo ], callback);
	},
	
	branches: function(user, repo, callback) {
		this._apiBase([ 'repos', user, repo, 'branches' ], callback);
	},
	
	tags: function(user, repo, callback) {
		this._apiBase([ 'repos', user, repo, 'tags' ], callback);
	},
	
	tag: function(user, repo, sha, callback) {
		this._apiBase([ 'repos', user, repo, 'git/tags', sha ], callback);
	},
	
	commits: function(user, repo, callback, params) {
		this._apiBase([ 'repos', user, repo, 'commits' ], callback, params);
	},
	
	commit: function(user, repo, sha, callback) {
		this._apiBase([ 'repos', user, repo, 'git/commits', sha ], callback);
	},
	
	tree: function(user, repo, sha, callback, params) {
		this._apiBase([ 'repos', user, repo, 'git/trees', sha ], callback, params);
	},
	
	_apiBase: function(parts, callback, params) {
		var options = params === undefined ? params : { data: params };
		this._ajax($.isArray(parts) ? parts.join('/') : parts, function(response) {
			if (response.meta.status == 200) {
				callback(true, response.data);
			}
			else {
				callback(false, response);
			}
		}, options);
	},
	
	_ajax: function(requestPath, callback, options) {
		var self = this;
		
		options = $.extend({}, {
			method: 'GET',
			data: {}
		}, options, {
			url: 'https://api.github.com/' + requestPath,
			dataType: 'jsonp',
			success: function(response, textStatus, xhr) {
				self.rateHandler(response.meta['X-RateLimit-Limit'], response.meta['X-RateLimit-Remaining']);
				callback(response);
			},
			error: function() {
				console.log('error', arguments);
			}
		});
		
		options.data['access_token'] = this.token;
		
		$.ajax(options);
	}
});

var git = window.git = new Git();

var user, repo;

var resetTo = function(level) {
	switch (level) {
		case 'repos':
			$('#Branches').empty().hide();
		case 'branches':
			$('#Commits').empty().hide();
		case 'commits':
			$('#Tree').empty().hide();
	}
};

var showCommit = function(sha) {
	git.commit(user, repo, sha, function(result, response) {
		if (result) {
			console.log(response);
			return;
			var ul = $('<ul>');
			for (var i = 0; i < response.tree.length; i++) {
				$('<li>')
					.text(response.tree[i].path + ' ')
					.addClass(response.tree[i].type + ' mode_' + response.tree[i].mode)
					.append($('<span class="sha">').text(response.tree[i].sha))
					.appendTo(ul);
			}
			$('#Tree').html(ul);
		}
	}, { recursive: 1 });
};

var showBranches = function(sha) {
	git.branches(user, repo, function(result, response) {
		if (result) {
			var ul = $('<ul>');
			for (var i = 0; i < response.length; i++) {
				$('<li>')
					.text(response[i].name + ' ')
					.append($('<span class="sha">').text(response[i].commit.sha))
					.data('sha', response[i].commit.sha)
					.click(function() {
						resetTo('branches');
						showCommit($(this).data('sha'));
					})
					.appendTo(ul);
			}
			$('#Branches').html(ul).show();
		}
	});
};

var showTree = function(sha) {
	git.tree(user, repo, sha, function(result, response) {
		if (result) {
			var ul = $('<ul>');
			for (var i = 0; i < response.tree.length; i++) {
				$('<li>')
					.text(response.tree[i].path + ' ')
					.addClass(response.tree[i].type + ' mode_' + response.tree[i].mode)
					.append($('<span class="sha">').text(response.tree[i].sha))
					.appendTo(ul);
			}
			$('#Tree').html(ul);
		}
	}, { recursive: 1 });
};

// Allow toggling of SHA's.
$(function(){
	$(document).on('click', '.togglesha li', function() {
		$(this).toggleClass('displaysha');
	});
	
	git.repos(function(result, response) {
		if (result) {
			var ul = $('<ul>');
			for (var i = 0; i < response.length; i++) {
				$('<li>')
					.text(response[i].owner.login + '/' + response[i].name)
					.data('user', response[i].owner.login)
					.data('repo', response[i].name)
					//.addClass(response[i].type + ' mode_' + response[i].mode)
					.click(function() {
						resetTo('repos');
						user = $(this).data('user');
						repo = $(this).data('repo');
						showBranches();
					})
					.appendTo(ul);
			}
			$('#Repos').html(ul);
		}
	});
});

})(jQuery);