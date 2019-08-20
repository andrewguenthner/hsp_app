filter_types = ['bp','fp','cs','ch','ce','cr']

function round(value, decimals)
    // published by Jack Moore at https://www.jacklmoore.com/notes/rounding-in-javascript/
    {
        return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    }

function alert_no_params ()
    {
        alert("No parameters for that compound were found.  \n Try a synonym, or a more common analog.")
    }

function alert_promise_rejected ()
    {
        console.log("Substance query was rejected.")
        alert("Your request could not be processed. \n Please contact the administrator.");
    }

function color_by_label (label_name)
    {
        return (label_name == "good solvents" ? "green" : "brown")
    }

function write_hsp_table_html (info)
    {
        return `<table class="table">
        <thead>
          <tr>
            <th scope="col">Substance</th>
            <th scope="col">Delta d</th>
            <th scope="col">Delta p</th>
            <th scope="col">Delta h</th>
            <th scope="col">Mol. Vol.</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">${info.display_name}</th>
            <td>${+info.delta_d}</td>
            <td>${+info.delta_p}</td>
            <td>${+info.delta_h}</td>
            <td>${+info.mol_vol}</td>
          </tr>
        </tbody>
      </table>`
    }

function write_multisolvent_table_html (info)
    {
        table_string = `<table class="table">
        <thead>
          <tr>
            <th scope="col">Substance</th>
            <th scope="col">Delta d</th>
            <th scope="col">Delta p</th>
            <th scope="col">Delta h</th>
            <th scope="col">Mol. Vol.</th>
            <th scope="col"><a href="red.html">RED</a></th>
          </tr>
        </thead>
        <tbody>`;
        info.forEach( function(row_data) {
            table_string += ` <tr>
            <th scope="row">${row_data.subst_display_name}</th>
            <td>${+row_data.delta_d}</td>
            <td>${+row_data.delta_p}</td>
            <td>${+row_data.delta_h}</td>
            <td>${+row_data.mol_vol}</td>
            <td>${round(+row_data.RED,1)}</td>
          </tr>`
        });
        table_string += `
            </tbody>
            </table>`;
        return table_string
    }

function retrieve_filter_limits(id_code)
    {
    filter_id = `#${id_code}_text`;
    filter_text = d3.select(filter_id).text();
    // Text is of the form ...range: {min -- must be a #} [optional words] to {max -- must be a #} {words}
    filter_range = filter_text.split("range: ")[1];
    filter_start = filter_range.split(" to ")[0];
    filter_end = filter_range.split(" to ")[1];
    filter_min = +filter_start.split(" ")[0];
    filter_max = +filter_end.split(" ")[0];
    return [filter_min, filter_max]
    }

function get_filter_info()
    {
    //limits_set will be an array of 2-element arrays, [min, max] for each filter type
    limits_set = filter_types.map( code => retrieve_filter_limits(code));
    //Make a string to pass to server
    info = "";
    filter_types.forEach( function(code, ix) {
        info += `${code}_${limits_set[ix][0]}to${limits_set[ix][1]}+`
        });
    console.log(info);
    return info
    }

function build_hsp_table(params)
    {
        console.log(params);
        if (params.valid) {
            d3.select("#est_hsp")
                .html(write_hsp_table_html(params));
            if (+params.src_id == 1) {
                d3.select("#est_hsp")
                    .append("p")
                    .text("These are experiment-based parameters reported by Hansen.")
            };
        }
        else {
            alert_no_params();
        }
    }

function create_hsp_plot(params)
    {
        if (params.valid)
        {
            let trace1 = {
                x:[params.delta_d],
                y:[params.delta_p],
                z:[params.delta_h],
                text:[params.display_name],
                name: params.display_name,
                mode: "markers",
                marker: {
                    size: 12,
                    color: "blue",
                    opacity: 0.8},
                type: "scatter3d"
            };

            let plotData = [trace1];

            let layout = {margin: {
                    l: 0,
                    r: 0,
                    b: 0,
                    t: 0
                    },
                scene: { 
                    xaxis: {
                        title: "delta-d"
                    },
                    yaxis: {
                        title: "delta-p"
                    },
                    zaxis: {
                        title: "delta-h"
                    }
                },
                legend: {
                    showLegend: true,
                    x: 1,
                    y: 0.8
                }
            };

        Plotly.newPlot("plot_3d", plotData, layout);
        };
    }

function updatePlot(plot_data,label)
    {
        let newTrace = {
            x: plot_data.map( dataPoint => dataPoint.delta_d),
            y: plot_data.map( dataPoint => dataPoint.delta_p),
            z: plot_data.map( dataPoint => dataPoint.delta_h),
            text: plot_data.map( dataPoint => dataPoint.subst_display_name),
            name: label,
            mode: "markers",
            marker: {
                size: 6,
                color: color_by_label(label),
                opacity: 0.8,
                },
            type: "scatter3d"
            };
        Plotly.addTraces("plot_3d",newTrace);
    }
    

function build_solvents_table(filter_string, params)
    {
        const params_string = `${params.delta_d}/${params.delta_p}/${params.delta_h}/`;
        const url = "/solvents/" + params_string + filter_string;
        d3.json(url).then( function(table_data) {
            const title_string = `Best solvents for ${params.display_name}:`
            d3.select("#best_solv_title")
                .html("");
            d3.select("#best_solv_title")
                .append("h5")
                .text(title_string);
            if (table_data.length > 0) {
                d3.select("#best_solv")
                    .html(write_multisolvent_table_html(table_data));
            updatePlot(table_data, "good solvents");
            }
            else
            {
                d3.select("#best_solv")
                    .html("No solvents were found matching the filters specified.<br>")
            }
        });
    }

function build_nonsolvents_table(filter_string, params)
    {
        const params_string = `${params.delta_d}/${params.delta_p}/${params.delta_h}/`;
        const url = "/nonsolvents/" + params_string + filter_string;
        d3.json(url).then( function(table_data) {
            console.log(table_data);
            const title_string = `Best non-solvents for ${params.display_name}:`
            d3.select("#worst_solv_title")
                .html("");
            d3.select("#worst_solv_title")
                .append("h5")
                .text(title_string);
                if (table_data.length > 0) {
                    d3.select("#worst_solv")
                        .html(write_multisolvent_table_html(table_data));
                    updatePlot(table_data, "poor solvents");
                }
                else
                {
                    d3.select("#worst_solv")
                        .html("No solvents were found matching the filters specified.")
                }
            });
    }

function build_tables(data) 
    {   
        build_hsp_table(data);
        create_hsp_plot(data);
        filter_info = get_filter_info();
        build_solvents_table(filter_info, data);
        build_nonsolvents_table(filter_info, data);
    }

function process_input ()
    {
        d3.event.preventDefault();
        const subst_text = d3.select("#substance_0").node().value;
        const query_text = subst_text.replace(/\W/g,'').toLowerCase();
        const url = "/estimate/" + query_text;
        d3.json(url).then(build_tables, alert_promise_rejected)
    };




alert(`Thanks for visiting!
NOTICE:  No liability or warranty is provided with this product.
You agree to use it at your own risk.  Please don't use solvents
unless you can do so safely.
ALPHA VERSION:  This version is still in testing.  The data have 
not yet been checked for accuracy, and you may encounter errors.`)
d3.select("#user_input").on("submit", process_input);


