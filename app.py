import os
import math
from collections import defaultdict
import numpy as np
import pandas as pd
import datetime as dt
import re
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func, inspect, desc

from flask import (
    Flask,
    render_template,
    jsonify,
    redirect)

from flask_sqlalchemy import SQLAlchemy


app = Flask(__name__)
# CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///db/hsp.sqlite"

db = SQLAlchemy(app)

class Solvents(db.Model):
    __tablename__= 'solvents'

    solvent_id = db.Column(db.Text, primary_key=True)
    nlm_num = db.Column(db.String())
    subst_display_name = db.Column(db.String())
    subst_category = db.Column(db.String())
    delta_d = db.Column(db.Float())
    delta_p = db.Column(db.Float())
    delta_h = db.Column(db.Float())
    mol_vol = db.Column(db.Float())
    src_id = db.Column(db.Integer())
    src_ref = db.Column(db.String())
    boil_pt = db.Column(db.Float())
    flash_pt = db.Column(db.Float())
    chem21_safety = db.Column(db.Integer())
    chem21_health = db.Column(db.Integer())
    chem21_env = db.Column(db.Integer())
    chem21_rank = db.Column(db.Integer())
    prop_src_id = db.Column(db.Integer())

    def __repr__(self):
        return '<Solvent %r>' % (self.subst_display_name)

class Polymers(db.Model):
    __tablename__= 'polymers'

    polymer_id = db.Column(db.Text, primary_key=True)
    subst_short_name = db.Column(db.String())
    subst_display_name = db.Column(db.String())
    delta_d = db.Column(db.Float())
    delta_p = db.Column(db.Float())
    delta_h = db.Column(db.Float())
    R0 = db.Column(db.Float())
    src_id = db.Column(db.Integer)

    def __repr__(self):
        return '<Polymer %r>' % (self.subst_display_name)

class Substances(db.Model):
    __tablename__= 'substances'

    substance_id = db.Column(db.Text, primary_key=True)
    nlm_num = db.Column(db.String())
    subst_display_name = db.Column(db.String())
    delta_d = db.Column(db.Float())
    delta_p = db.Column(db.Float())
    delta_h = db.Column(db.Float())
    mol_vol = db.Column(db.Float())
    src_id = db.Column(db.Integer)

    def __repr__(self):
        return '<Substance %r>' % (self.subst_display_name)

class Substance_names(db.Model):
    __tablename__= 'substancenames'

    substancename_id = db.Column(db.Text, primary_key=True)
    nlm_num = db.Column(db.String())
    subst_short_name = db.Column(db.String())

    def __repr__(self):
        return '<Substance_name %r>' % (self.subst_short_name)

cols_from_codes = {
    "bp":"boil_pt",
    "fp":"flash_pt",
    "cs":"chem21_safety",
    "ch":"chem21_health",
    "ce":"chem21_env",
    "cr":"chem21_rank"
}
    

def parse_filter_params(params_string : str):
    """Convert a string of the film {xx_#to#-} where xx is a two-letter code, and # represents
    any digit, to a dictionary giving the two-letter codes as keys and values in the form of an 
    array of [min, max]. 'to', and the '_' and '+' characters must be present"""

    filter_dict = dict()
    # Default filter range will be from 1 to 10, use for error handling and
    # for most input cases as well.  Only exceptions need to be coded. 
    filter_default_mins = defaultdict(lambda: 1)
    filter_default_maxs = defaultdict(lambda: 10)
    filter_default_mins['bp'] = 0
    filter_default_mins['fp'] = -50
    filter_default_maxs['bp'] = 300
    filter_default_maxs['fp'] = 300
    filter_default_maxs['cr'] = 4
    individual_filters = params_string.split('+')
    for filter_item in individual_filters:
        filter_code = filter_item.split('_')[0]
        if filter_code == '':
            continue
        try:
            filter_range = filter_item.split('_')[1]
        except IndexError:
            filter_range = ['1to10']
        filter_minmax = filter_range.split('to')
        filter_values = []
        try:
            filter_values.append(int(filter_minmax[0]))
        except ValueError:
            filter_values.append(filter_default_mins[filter_code])
        try:
            filter_values.append(int(filter_minmax[1]))
        except (ValueError,IndexError):
            filter_values.append(filter_default_maxs[filter_code])
        # Only return filter keys when default values are not selected
        # That way, the default values will actually "select all" including 
        # any solvents for which data is missing.  
        # Force order to be [min, max]
        if filter_code and ((filter_values[0] != filter_default_mins[filter_code]) \
            or (filter_values[1] != filter_default_maxs[filter_code])):
            filter_dict[filter_code] = sorted(filter_values)
    return filter_dict 

@app.before_first_request
def setup():
    print("set up")
    db.create_all()
    

@app.route("/")
def home():
    """Render Home Page."""
    return render_template("base.html")

@app.route("/estimate_only/<substance>")
def get_computed_hsp(substance):
    """Look up substance and return delta_d, delta_p, delta_h as JSON dict, with
    added data of substance display name, molecular volume, and source info.  Uses
    only the available computed values, not experimental values."""
    #Check input to make sure only allowed characters are included
    substance_check_pattern = re.compile('[\W_]+', re.UNICODE)
    substance_check = substance_check_pattern.sub('',substance,count=-1)
    if substance_check != substance:  #Will happen only if input has been corrupted
        return jsonify({'valid':False})
    
    # SELECT *
    # FROM Substance_Names INNER JOIN Substances ON mln_num
    # WHERE Substance_Names.subst_short_name == substance 
    hsp_result = db.session.query(Substances).\
        select_from(Substance_names).\
        join(Substances,Substance_names.nlm_num == Substances.nlm_num).\
        filter(Substance_names.subst_short_name == substance).first()
    
    output_dict = {}
    if hsp_result:
        output_dict['valid'] = True
        output_dict['display_name'] = hsp_result.subst_display_name
        output_dict['delta_d'] = hsp_result.delta_d
        output_dict['delta_p'] = hsp_result.delta_p
        output_dict['delta_h'] = hsp_result.delta_h
        output_dict['mol_vol'] = hsp_result.mol_vol
        output_dict['src_id'] = hsp_result.src_id
    else:
        output_dict['valid'] = False

    return jsonify(output_dict)

@app.route("/estimate/<substance>")
def estimate_hsp(substance):
    """Look up substance and return delta_d, delta_p, delta_h as JSON dict, with
    added data of substance display name, molecular volume, and source info.  Looks
    for experimental values first, then falls back on computed values from the
    estimates_only route."""

    polymers_checked = False
    
    #Check input to make sure only allowed characters are included
    substance_check_pattern = re.compile('[\W_]+', re.UNICODE)
    substance_check = substance_check_pattern.sub('',substance,count=-1)
    if substance_check != substance:  #Will happen only if input has been corrupted
        return jsonify({'valid':False})
    
    #Query the solvents table first for experimental values
    exp_hsp_result = db.session.query(Solvents).\
        select_from(Substance_names).\
        join(Solvents,Substance_names.nlm_num == Solvents.nlm_num).\
        filter(Substance_names.subst_short_name == substance).first()
    
    #Then query the polymers table for experimental values.  Note that 
    #the polymers table does not use nlm numbers, only short names 
    if not exp_hsp_result:
        polymers_checked = True
        exp_hsp_result = db.session.query(Polymers).\
            filter(Polymers.subst_short_name == substance).first()

    output_dict = {}
    if exp_hsp_result:
        output_dict['valid'] = True
        output_dict['display_name'] = exp_hsp_result.subst_display_name
        output_dict['delta_d'] = exp_hsp_result.delta_d
        output_dict['delta_p'] = exp_hsp_result.delta_p
        output_dict['delta_h'] = exp_hsp_result.delta_h
        output_dict['src_id'] = exp_hsp_result.src_id
        if polymers_checked:
            output_dict['R0'] = exp_hsp_result.R0
            output_dict['mol_vol'] = 'n/a'
        else:
            output_dict['mol_vol'] = exp_hsp_result.mol_vol
            output_dict['R0'] = 'n/a'
    else:  #No results from either table 
        estimator_url = "/estimate_only/" + substance
        return redirect(estimator_url)


    return jsonify(output_dict)

@app.route("/solvents/<delta_d>/<delta_p>/<delta_h>/<filter_params>")
def best_solvents(delta_d, delta_p, delta_h,filter_params):
    """Search solvents on the basis of RED (sorted ascending) with given Hansen parameters, and with
    a formatted string indicating filter parameters.  See the function parse_filter_params
    for details of filter parameters string."""

    results_list = []
    filter_dict = parse_filter_params(filter_params)
    try:
        delta_d = float(delta_d)
        delta_p = float(delta_p)
        delta_h = float(delta_h)
    except ValueError:
        return jsonify(results_list)
    
    #Since we need most of the info and the solvents table is not big, we'll just read it
    #straight to a DataFrame
    solvent_df = pd.read_sql('solvents',db.engine)

    for code_key, min_max in filter_dict.items():
        solvent_df = solvent_df[(solvent_df[cols_from_codes[code_key]] >= min_max[0]) & \
                                (solvent_df[cols_from_codes[code_key]] <= min_max[1])]
    if len(solvent_df) == 0:
        return jsonify(results_list)
    solvent_df['RED2'] = 4 * (solvent_df['delta_d'] - delta_d) * (solvent_df['delta_d'] - delta_d) + \
                        (solvent_df['delta_p'] - delta_p) * (solvent_df['delta_p'] - delta_p) + \
                        (solvent_df['delta_h'] - delta_h) * (solvent_df['delta_h'] - delta_h) 
    solvent_df['RED'] = solvent_df['RED2'].apply(np.sqrt)
    solvent_df = solvent_df.sort_values(by='RED')
    # Limit output to top 5, fill NaN's
    results_list = solvent_df.head().fillna('').to_dict(orient='records')
    return jsonify(results_list)

@app.route("/nonsolvents/<delta_d>/<delta_p>/<delta_h>/<filter_params>")
def worst_solvents(delta_d, delta_p, delta_h, filter_params):
    """Search solvents on the basis of RED (sorted descending) with given Hansen parameters, and with
    a formatted string indicating filter parameters.  See the function parse_filter_params
    for details of filter parameters string."""

    results_list = []
    filter_dict = parse_filter_params(filter_params)
    try:
        delta_d = float(delta_d)
        delta_p = float(delta_p)
        delta_h = float(delta_h)
    except ValueError:
        return jsonify(results_list)
    
    #Since we need most of the info and the solvents table is not big, we'll just read it
    #straight to a DataFrame
    solvent_df = pd.read_sql('solvents',db.engine)

    for code_key, min_max in filter_dict.items():
        solvent_df = solvent_df[(solvent_df[cols_from_codes[code_key]] >= min_max[0]) & \
                                (solvent_df[cols_from_codes[code_key]] <= min_max[1])]
    if len(solvent_df) == 0:
        return jsonify(results_list)
    solvent_df['RED2'] = 4 * (solvent_df['delta_d'] - delta_d) * (solvent_df['delta_d'] - delta_d) + \
                        (solvent_df['delta_p'] - delta_p) * (solvent_df['delta_p'] - delta_p) + \
                        (solvent_df['delta_h'] - delta_h) * (solvent_df['delta_h'] - delta_h) 
    solvent_df['RED'] = solvent_df['RED2'].apply(np.sqrt)
    solvent_df = solvent_df.sort_values(by='RED', ascending=False)
    # Limit output to top 5
    results_list = solvent_df.head().fillna('').to_dict(orient='records')
    return jsonify(results_list)
if __name__ == '__main__':
    app.run(debug=True)

