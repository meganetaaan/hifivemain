/*
 * Copyright (C) 2012-2014 NS Solutions Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * hifive
 */

(function($) {
	// -------------- 共通 --------------
	function escapeHTML(val) {
		return $('<div/>').text(val).html();
	}

	// -------------- メソッドやメンバの概要を追加 --------------
	$(function() {
		var $summary = $('<div id="summary"></div>');
		var $containerOverview = $('.container-overview');
		$containerOverview.after($summary);

		$('article>h3.subsection-title').each(
				function() {
					// テーブルの追加
					if ($(this).text() == "Namespaces") {
						// Namespacesは概要の前に表示する
						$containerOverview.after($(this), $(this).next());
						return;
					}
					var tableTitle = $(this).text() + ': 概要';
					$constructaTable = $('<table class="summaryTable constructa"></table>');
					$constructaTable.append('<thead><tr><th colspan=3>' + tableTitle
							+ '</th><tr></thead>');

					// テーブルの中身を追加
					$(this).next().children('dt').each(
							function() {
								var name = $.trim(escapeHTML($(this).text().replace(/<.*> /, '')));
								var type = $.trim($(this).html()).match(" :.*$");
								if (!type) {
									type = ' ';
								} else {
									type = type[0].replace(/ :/, '');
									name = name.split(' :')[0];
								}
								var link = name.replace(/ /g, '');
								var desc = $(this).next().find('.description:first').text();
								if (!tableTitle.match('Members')) {
									$constructaTable.append('<tbody><tr><td colspan=2><a href="#'
											+ link + '">' + name + '</td><td>' + desc
											+ '</td><tr></thead>');
								} else {
									$constructaTable.append('<tbody><tr><td><a href="#' + link
											+ '">' + name + '</td><td>' + type + '</td><td>' + desc
											+ '</td><tr></thead>');
								}
								$summary.append($constructaTable);

								// リンクの追加
								$(this).find('h4').prepend('<a name="' + link + '"/>');
							});
				});

		// 水平線の追加
		if ($summary.html()) {
			$summary.after("<hr>");
			$summary.before("<hr>");
		}
	});

	//-------------- Returns: の中のTypeを見やすくする --------------
	$(function() {
		$('.param-desc')
				.each(
						function() {
							var type = $(this).next().find('.param-type').html();
							var desc = $(this).html();
							$returnsTable = $('<table class="returnsTable"><thead><tr><th>Type</th><th class="last">Description</th></tr></thead></table>');
							$returnsTable.append('<tbody><tr><td>' + type + '</td><td>' + desc
									+ '</td></tr></tbody>');
							$(this).html('');
							$(this).next().remove();
							$(this).append($returnsTable);
						});
	});

	//-------------- 検索機能の追加 --------------
	$(function() {
		var $search = $('.h5-searchBox');
		var $targetLists = $('nav ul>li');
		function search(keyword) {
			keyword = $.trim(keyword.toLowerCase());
			if (keyword) {
				$targetLists.each(function() {
					var $this = $(this);
					if ($this.text().toLowerCase().indexOf(keyword) !== -1) {
						$this.removeClass('hidden');
					} else {
						$this.addClass('hidden');
					}
				});
			} else {
				$targetLists.removeClass('hidden');
			}
		}
		$search.find('.clear').click(function() {
			$search.find('input').val('');
			search('');
		});
		$search.find('input').bind('keydown', function() {
			var $input = $(this);
			setTimeout(function() {
				search($input.val());
			}, 0);
		});
	});
})(jQuery);