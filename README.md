# hsp_app
Current version = 0.1 alpha

This is an early version for testing purposes.

The latest version of this program will be demonstrated at the American Chemical
Society meeting in San Diego, CA on Monday Aug 26th.  

The app will be deployed on Heroku at:

hsp-data.herokuapp.com

The app takes as input the name of any chemical (or synonym) in the National 
Library of Medicine database (currently about 120,000 compounds and about 
600,000 synonyms). The Hansen Solubility Parameters of the compound will then 
be displayed, based on 1) experimental data availale mainly for solvents and 
polymers only, or, if no such data exists in the database, 2) calculated 
parameters estimated with either the original Fedors method as reported by Hansen.
(Other computed estimated may be added later.)  By default the app will 
display the Hansen Solubility Parameters of the compound of interest, the
five "best" solvents (based on the "relative energy distance" concept), and
the five "worst" solvents (which are the five most desirable substances to 
use for operations such as precipitation).  

The solvents / nonsolvents can be filtered on the basis of boiling point range,
flash point range, or the safety, health, and environmental impact rankings 
provided in the "Chem21" system (see Prat et al., Green Chem., 2016,18, 288-296,
DOI: 10.1039/C5GC01008J, available for free at https://pubs.rsc.org/en/content/articlelanding/gc/2016/c5gc01008j#!divAbstract).  The "Chem21 rank" can also be
used as a filter.  The "rank" is an overall classification with four levels:

1) Solvents that are recommended for general use (a good choice for scale-up 
and many commercial and industrial processes)
2) Solvents that can be well-suited to scale-up, but which are likely to pose 
problems for many commercial and industrial uses ("problematic")
3) Solvents that are not likely to be suitable for scale-up and will likely 
require substitution for operations beyond kg scale ("hazardous")
4) Solvents that, due to significant health, safety, and environmental issues,
are best avoided, even for laboratory or small-scale operations ("highly 
hazardous")

This advice is meant for general solvent comparison acitvities only; it is not 
intended to substitute for the careful examination of safety, health, and 
environmental impact issues that should precede any operation with solvents.

At the moment, the database is limited to about 135 compounds with experimental 
data, and a few hundred synonyms.  A couple of interesting use cases that are
possible even at this level of functionality include:

1) Solvent substitution or adjustment -- for instance, if you wanted a less harmful 
alternative to toluene, you could enter "toluene" and set the filters to select 
only solvents having a low level of health impact.  The "best solvents" displayed 
would be those meeting your criteria that have Hansen parameters most similar to 
toluene (thereby giving a high likelihood of similar performance in situations 
where solubility characteristics are important).  You could also, for instance, 
find an alternative to acetone with a higher flashpoint.  

2) Solvent non-solvent separations -- enter "toluene" with no filters and you 
will notice that the "best" (most similar) solvents and the "best" (least similar)
non-solvents are separated by quite a distance in "parameter space" (the application 
will generate a 3-D plot that shows your selected compound and its relation to both 
the "good solvents" and "poor solvents" in parameter space.)  This separation indicates 
that it is quite easy, for instance, to find a non-solvent that will precipiate a 
substance that is highly soluble in toluene.  Make the filters more restrictive and 
you will notice that the gap between good and poor solvents begins to shrink, sometimes 
quite considerably.  This type of investigation can give you a quick sense of how much 
certain process constraints (such as, a need to avoid flammability issues) will be 
likely to impact the robustness of the process.  

Other features that are coming soon --
1)  inclusion of polymer data (there will be an input element to denote the substance 
of interest is a polymer, selecting this will search a different set of compounds and make 
available a "radius of interaction" that tends to divide good and poor solvents, when 
experimentally this radius is known).
2) computation for all National Library of Medicine compounds -- this will add the 
important use case of searching for solvents / non-solvents for a wide range of compounds
3) arbitrary SMILES (maybe!!!  if there's enough interest) -- this will enable instant 
calculation of Hansen parameters for arbitrary compounds

The final feature set will depend strongly on user feedback, so please let me know if 
you have features you'd like to see.

If you'd like to contribute by testing, particularly on non-Windows operating systems 
and mobile devices, those efforts would be greatly appreciated.  If you'd like to 
contribute to writing or re-factoring the source code or adding information to the 
database, please contact me.  

I can be reached at:  andrewguenthner@gmail.com



