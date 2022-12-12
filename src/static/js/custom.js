var table_idx = 0;
var total_examples = 1;
var dataset = window.default_dataset;
var mode = window.mode;
var pipelines = window.pipelines;
var url_prefix = window.location.href.split('#')[0];
var split = "dev";
var splitInstance = Split(['#centerpanel', '#rightpanel'], { sizes: [70, 30], gutterSize: 1 });

function randint(max) {
  return Math.floor(Math.random() * max);
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

function nextbtn() {
  gotopage(table_idx + 1);
}

function prevbtn() {
  gotopage(table_idx - 1);
}

function startbtn() {
  gotopage(0);
}

function endbtn() {
  gotopage(total_examples - 1);
}

function randombtn() {
  gotopage(randint(total_examples - 1));
}

function gotobtn() {
  var n = $("#page-input").val();
  gotopage(n);
}

function gotopage(page) {
  table_idx = page;
  table_idx = mod(table_idx, total_examples);

  fetch_table(dataset, split, table_idx);
  $("#page-input").val(table_idx);
}

function get_highlighted_cells() {
  var activeCells = $("#tablearea").find(".table-active").map(
    function () {
      return $(this).attr("cell-idx");
    }).get();

  // no highlighted cells -> send all cells except headers
  if (activeCells.length == 0) {
    activeCells = $("#tablearea").find("td").map(
      function () {
        return $(this).attr("cell-idx");
      }).get();
  }
  return activeCells;
}

// function load_model() {
//   $.ajax({
//     type: "GET",
//     url: `${url_prefix}/load_model`,
//     data: {
//       "model": "totto"
//     },
//     // beforeSend: function() {
//     //     $("#gen-btn").prop('disabled', true);
//     // },
//     success: function (data) {
//       $("#gen-btn").html('Generate');
//       $("#gen-btn").removeClass('disabled');
//     }
//   })
// }

function run_pipeline(pipeline) {
  cells = get_highlighted_cells();
  dataset = $('#dataset-select').val();
  split = $('#split-select').val();

  var payload = {
    "cells": cells,
  };

  var request = {
    "pipeline": pipeline,
    "dataset": dataset,
    "split": split,
    "table_idx": table_idx,
    "payload": payload
  };

  $.ajax({
    type: "POST",
    contentType: "application/json; charset=utf-8",
    url: `${url_prefix}/pipeline`,
    data: JSON.stringify(request),
    success: function (data) {
      output = data["out"];

      $("#dataset-spinner").hide();

      if ($(`#out-${pipeline}`).length) {
        $(`#out-${pipeline}-placeholder`).html(output);
      } else {
        $("#outputarea").append(`<div class="pipeline-output" id="out-${pipeline}">
            <label>${pipeline}</label>
            <div id="out-${pipeline}-placeholder" class="font-mono">${output}</div>
        </div>`);
      }
      // $("#outputarea").show();
      // $("#gen-btn").html("Generate");
      // $("#gen-btn").removeClass('disabled');
    },
    dataType: "json"
  });
}

$('.pipeline-checkbox').on('change', function () {
  pipeline_name = $(this)[0].id;
  var pipeline_name = $(`label[for='${pipeline_name}']`).text();
  pipelines['translate'].active = !pipelines['translate'].active;
});

function parse_info(info) {
  return ("<h3>" + info.name + "</h3><p>" + info.description + "</p>" +
    "<h5>Homepage</h5><p><a href=\"" + info.homepage + "\">" + info.homepage + "</a></p>" +
    "<h5>Citation:</h5><p><code>" + info.citation + "</code></p>")
}

function fetch_table(dataset, split, table_idx, export_format) {
  var export_format = $("#format-select").val();

  $.get(`${url_prefix}/table`, {
    "dataset": dataset,
    "table_idx": table_idx,
    "split": split,
    "export_format": export_format
  }, function (data) {
    $("#tablearea").html(data.html);
    $("#dataset-spinner").hide();
    total_examples = data.total_examples;
    info = parse_info(data.dataset_info);

    ["th", "td"].forEach(
      function (celltype) {
        var cells = $("#tablearea").find(celltype);
        cells.on("click",
          function () {
            $(this).toggleClass("table-active");
          }
        );
        $("#tablearea").addClass("interactive-cell");
      }
    );
    $("#dataset-info").html(info);

    for (var pipeline in pipelines) {
      if (pipelines[pipeline].active == 1) {
        console.log("running pipeline " + pipeline);
        run_pipeline(pipeline);
      }
    }

  });
}


$('#panel-checkbox').on('change', function () {
  if ($('#rightpanel').hasClass("show")) {
    splitInstance.collapse(1);
    // $('#tabulararea').css("overflow-x", "auto");
    $('.gutter').hide();
  } else {
    splitInstance.setSizes([70, 30])
    // $('#tabulararea').css("overflow-x", "scroll");
    $('.gutter').show();
  }
  $('#rightpanel').collapse("toggle");
});

$("#dataset-select").on("change", function (e) {
  $("#dataset-spinner").show();
  dataset = $('#dataset-select').val();
  table_idx = 0;
  fetch_table(dataset, split, table_idx);
  $("#page-input").val(table_idx);
});


$("#split-select").on("change", function (e) {
  $("#dataset-spinner").show();
  split = $('#split-select').val();
  table_idx = 0;
  fetch_table(dataset, split, table_idx);
  $("#page-input").val(table_idx);
});

$("#format-select").on("change", function (e) {
  $("#dataset-spinner").show();
  console.log("on format select");
  fetch_table(dataset, split, table_idx);
});


$('#page-input').keypress(function (event) {
  if (event.keyCode == 13) {
    gotobtn();
  }
});


$(document).ready(function () {
  $("#dataset-select").val(dataset).change();

  // fetch_table(dataset, split, table_idx);
  $("#page-input").val(table_idx);

  // if (mode != "light") {
  //   load_model();
  // }
});
