'use strict';

window.addEventListener('load', function() {
	let docid = getDocumentId();

	$('#print').addEventListener('click', function() { window.print(); })

	// generate the plain document view
	callServer('/api/document/' + docid, {}, function(doc) {
    	generateDocument(doc);
    	$('#planner').href = '/doc/' + docid;
		$('#document-name').textContent = doc.name;
    })
})

// reformat the page and remove the nav for printing
window.addEventListener('beforeprint', function() {
	$('main').style.marginTop = '2em';
	$('header').style.display = 'none';
})

// add the nav and reformat after printing is done or canceled
window.addEventListener('afterprint', function() {
	$('main').style.marginTop = '8em';
	$('header').style.display = 'block';
})

/**
 * generate the document
 * @param  {Object} doc
 */
function generateDocument(doc) {
	let main = $('main');

	// generate each week
	doc.weeks.forEach(function(week) {
		generateWeek(week, main);
	})
}

/**
 * generate a week
 * @param  {Object} week
 * @param  {Node} container
 */
function generateWeek(week, container) {
	let week_block = newEl('section');

	// week header
	let week_head = newEl('div', {
		classList: 'week-head'
	}); 

	// week name
	week_head.append(newEl('h2', {
		classList: 'week-head',
		textContent: week.weekname,
	}))
	// week period
	week_head.append(newEl('span', {
		classList: 'week-period', 
		textContent: getWeekPeriod(week.day).start + ' to ' +  getWeekPeriod(week.day).end,
	}))
	week_block.append(week_head);

	// week content
	let week_content = newEl('div', {
		classList: 'week-content',
	})
	// generate each sturcture
	week.structures.forEach(function(structure) {
		generateStructure(structure, week_content);
	});

	week_block.append(week_content);
	container.append(week_block);
}

/**
 * generate a sturcture
 * @param  {Object} structure
 * @param  {Node} container
 */
function generateStructure(structure, container) {
	let structure_block = newEl('div', {
		classList: 'structure',
	})

	// structure name
	structure_block.append(newEl('h3', {
		classList: 'structure-name',
		textContent: structure.structurename
	}))

	// comments
	let comments_block = newEl('div', {
		classList: 'comments'
	})

	structure.comments.split('\n').forEach(function(comment) {
		comments_block.append(newEl('p', {
			textContent: comment
		}))
	})
	structure_block.append(comments_block);

	// resources
	let resources_list = newEl('ul', {
		classList: 'resources',
	})

	structure.resources.forEach(function(resource) {
		let resource_item = newEl('li');

		resource_item.append(newEl('b', {
			textContent: resource.resourcename + ': ',
		}))

		resource_item.append(newEl('a', {
			href: resource.url,
			textContent: resource.url,
			target: '_blank',
		}))

		resources_list.append(resource_item);
	})

	structure_block.append(resources_list);
	container.append(structure_block);
}