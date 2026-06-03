#!/usr/bin/env python3
"""
Compile county clerk of court contact information from research sources.
Creates enriched JSON file with contact data for NC, NY, and OH counties.
"""

import json
from datetime import datetime

# Complete New York data
NY_COUNTIES = [
    {"county_name": "Albany", "phone": "(518) 487-5110", "fax": "(518) 487-5099", "address": "16 Eagle St., Rm 128, Albany, NY 12207", "clerk_website": "https://www.albanycountyny.gov/government/departments/county-clerk"},
    {"county_name": "Allegany", "phone": "(585) 268-9270", "fax": "(585) 268-9659", "address": "7 Court St., Rm 13, Belmont, NY 14813"},
    {"county_name": "Broome", "phone": "(607) 778-2451", "fax": "(607) 778-2243", "address": "60 Hawley Street, Binghamton, NY 13902"},
    {"county_name": "Cattaraugus", "phone": "(716) 938-2297", "fax": "(716) 938-2773", "address": "303 Court Street, Little Valley, NY 14755"},
    {"county_name": "Cayuga", "phone": "(315) 253-1271", "fax": "", "address": "160 Genesee Street, 6th Floor, Auburn, NY 13021"},
    {"county_name": "Chautauqua", "phone": "(716) 753-4331", "fax": "(716) 753-4293", "address": "1 N. Erie St, Mayville, NY 14757"},
    {"county_name": "Chemung", "phone": "(607) 737-2920", "fax": "(607) 737-2897", "address": "210 Lake St., Elmira, NY 14902"},
    {"county_name": "Chenango", "phone": "(607) 337-1450", "fax": "(607) 337-1455", "address": "5 Court St., Norwich, NY 13815"},
    {"county_name": "Clinton", "phone": "(518) 565-4700", "fax": "(518) 565-4718", "address": "137 Margaret St., Suite 101, Plattsburgh, NY 12901"},
    {"county_name": "Columbia", "phone": "(518) 828-3339", "fax": "(518) 828-5499", "address": "560 Warren St., Hudson, NY 12534"},
    {"county_name": "Cortland", "phone": "(607) 753-5021", "fax": "(607) 753-5378", "address": "46 Greenbush St., Suite 105, Cortland, NY 13045"},
    {"county_name": "Delaware", "phone": "(607) 832-5700", "fax": "(607) 832-6046", "address": "P.O. Box 426, Delhi, NY 13753"},
    {"county_name": "Dutchess", "phone": "(845) 486-2120", "fax": "(845) 486-2138", "address": "22 Market St., Poughkeepsie, NY 12601"},
    {"county_name": "Erie", "phone": "(716) 858-8785", "fax": "(716) 858-6550", "address": "92 Franklin St., 1st Floor, Buffalo, NY 14202"},
    {"county_name": "Essex", "phone": "(518) 873-3600", "fax": "(518) 873-3548", "address": "7559 Court Street, Elizabethtown, NY 12932"},
    {"county_name": "Franklin", "phone": "(518) 481-1681", "fax": "", "address": "355 W. Main St., Malone, NY 12953"},
    {"county_name": "Fulton", "phone": "(518) 736-5555", "fax": "(518) 762-9214", "address": "P.O. Box 485, Johnstown, NY 12095"},
    {"county_name": "Genesee", "phone": "(585) 344-2550", "fax": "(585) 344-8521", "address": "15 Main St., Batavia, NY 14021"},
    {"county_name": "Greene", "phone": "(518) 719-3255", "fax": "(518) 719-3280", "address": "411 Main St., Catskill, NY 12414"},
    {"county_name": "Hamilton", "phone": "(518) 548-7111", "fax": "(518) 548-9740", "address": "P.O. Box 204, Lake Pleasant, NY 12108"},
    {"county_name": "Herkimer", "phone": "(315) 867-1129", "fax": "(315) 866-4396", "address": "109 Mary Street, Suite 1111, Herkimer, NY 13350"},
    {"county_name": "Jefferson", "phone": "(315) 785-3081", "fax": "(315) 785-5048", "address": "175 Arsenal St., Watertown, NY 13601"},
    {"county_name": "Lewis", "phone": "(315) 376-5333", "fax": "(315) 376-3768", "address": "7660 N. State Street, Lowville, NY 13367"},
    {"county_name": "Livingston", "phone": "(585) 243-7010", "fax": "(585) 243-7159", "address": "6 Court St., Geneseo, NY 14454"},
    {"county_name": "Madison", "phone": "(315) 366-2261", "fax": "(315) 366-2502", "address": "P.O. Box 668, Wampsville, NY 13163"},
    {"county_name": "Monroe", "phone": "(585) 753-1600", "fax": "(585) 753-1650", "address": "39 W Main St., Rochester, NY 14614"},
    {"county_name": "Montgomery", "phone": "(518) 853-8116", "fax": "(518) 853-8171", "address": "64 Broadway, Fonda, NY 12068"},
    {"county_name": "Nassau", "phone": "(516) 571-2660", "fax": "(516) 742-4099", "address": "240 Old Country Rd., Mineola, NY 11501"},
    {"county_name": "Bronx", "phone": "(866) 797-7214", "fax": "(718) 590-8122", "address": "851 Grand Course Rm. 301, Bronx, NY 10451"},
    {"county_name": "Richmond", "phone": "(718) 675-7700", "fax": "", "address": "130 Stuyvesant Pl., Staten Island, NY 10301"},
    {"county_name": "New York", "phone": "(646) 386-5955", "fax": "(212) 374-5970", "address": "60 Centre St., Room 161, New York, NY 10007"},
    {"county_name": "Queens", "phone": "(718) 298-0601", "fax": "", "address": "88-11 Sutphin Blvd., Jamaica, NY 11435"},
    {"county_name": "Kings", "phone": "(347) 404-9772", "fax": "(718) 643-8187", "address": "360 Adams St. Rm. 189, Brooklyn, NY 11201"},
    {"county_name": "Niagara", "phone": "(716) 439-7022", "fax": "(716) 439-7035", "address": "175 Hawley St., Lockport, NY 14095"},
    {"county_name": "Oneida", "phone": "(315) 798-5776", "fax": "(315) 798-6440", "address": "800 Park Ave, Utica, NY 13501"},
    {"county_name": "Onondaga", "phone": "(315) 435-2226", "fax": "", "address": "401 Montgomery Street, Syracuse, NY 13202"},
    {"county_name": "Ontario", "phone": "(585) 396-4200", "fax": "(585) 393-2951", "address": "20 Ontario St., Canandaigua, NY 14424"},
    {"county_name": "Orange", "phone": "(845) 291-2690", "fax": "(845) 291-2691", "address": "255 Main St., Goshen, NY 10924"},
    {"county_name": "Orleans", "phone": "(585) 589-5334", "fax": "(585) 589-0181", "address": "3 South Main Street, Suite 1, Albion, NY 14411"},
    {"county_name": "Oswego", "phone": "(315) 349-8621", "fax": "(315) 349-8383", "address": "46 E. Bridge St., Owego, NY 13126"},
    {"county_name": "Otsego", "phone": "(607) 547-4276", "fax": "(607) 547-7544", "address": "197 Main St., Cooperstown, NY 13326"},
    {"county_name": "Putnam", "phone": "(845) 808-1142", "fax": "(845) 228-0231", "address": "40 Gleneida Ave., Caramel, NY 10512"},
    {"county_name": "Rensselaer", "phone": "(518) 270-4080", "fax": "(518) 271-7998", "address": "105 Third Street, Troy, NY 12180"},
    {"county_name": "Rockland", "phone": "(845) 638-5221", "fax": "(845) 638-5647", "address": "1 South Main Street Suite 100, New City, NY 10956"},
    {"county_name": "Saratoga", "phone": "(518) 885-2213", "fax": "(518) 884-4771", "address": "40 McMaster St., Ballston Spa, NY 12020"},
    {"county_name": "Schenectady", "phone": "(518) 388-4220", "fax": "(518) 388-4224", "address": "620 State St., Schenectady, NY 12305"},
    {"county_name": "Schoharie", "phone": "(518) 295-8316", "fax": "(518) 295-8338", "address": "284 Main St., Schoharie, NY 12157"},
    {"county_name": "Schuyler", "phone": "(607) 535-8133", "fax": "(607) 535-8130", "address": "105 Ninth St., Unit 8, Watkins Glen, NY 14891"},
    {"county_name": "Seneca", "phone": "(315) 539-1771", "fax": "(315) 539-3789", "address": "1 DiPronio Dr., Waterloo, NY 13165"},
    {"county_name": "St. Lawrence", "phone": "(315) 379-2237", "fax": "(315) 379-2302", "address": "48 Court St., Canton, NY 13617"},
    {"county_name": "Steuben", "phone": "(607) 664-2563", "fax": "(607) 664-2158", "address": "3 E. Pulteney Square, Bath, NY 14810"},
    {"county_name": "Suffolk", "phone": "(631) 852-2001", "fax": "(631) 852-2004", "address": "310 Center Drive, Riverhead, NY 11901"},
    {"county_name": "Sullivan", "phone": "(845) 807-0411", "fax": "(845) 807-0434", "address": "100 North St., Monticello, NY"},
    {"county_name": "Tioga", "phone": "(607) 687-8660", "fax": "(607) 687-8686", "address": "16 Court St., Owego, NY 13827"},
    {"county_name": "Tompkins", "phone": "(607) 274-5431", "fax": "", "address": "320 N. Tioga St., Ithaca, NY 14850"},
    {"county_name": "Ulster", "phone": "(845) 340-3040", "fax": "(845) 340-3299", "address": "244 Fair St., Kingston, NY 12402"},
    {"county_name": "Warren", "phone": "(518) 761-6484", "fax": "(518) 761-6551", "address": "1340 State Route 9, Lake George, NY 12845"},
    {"county_name": "Washington", "phone": "(518) 746-2170", "fax": "(518) 746-2177", "address": "383 Broadway, Fort Edward, NY 12828"},
    {"county_name": "Wayne", "phone": "(315) 946-7470", "fax": "(315) 946-5978", "address": "9 Pearl St., Lyons, NY 14489"},
    {"county_name": "Westchester", "phone": "(914) 995-3080", "fax": "(914) 285-9005", "address": "110 Martin Luther King Jr. Blvd., White Plains, NY 10601"},
    {"county_name": "Wyoming", "phone": "(585) 786-8810", "fax": "(585) 786-3703", "address": "143 N. Main St., Suite 104, Warsaw, NY 14569"},
    {"county_name": "Yates", "phone": "(315) 536-5120", "fax": "(315) 536-5545", "address": "417 Liberty St., Penn Yan, NY 14527"},
]

# Complete Ohio data
OH_COUNTIES = [
    {"county_name": "Adams", "phone": "(937) 544-2344", "fax": "(937) 544-8271", "address": "110 W Main St, Room 207, West Union, OH 45693", "clerk_website": "https://www.adamscountycourts.com"},
    {"county_name": "Allen", "phone": "(419) 223-8512", "fax": "", "address": "301 N Main St, Lima, OH 45801"},
    {"county_name": "Ashland", "phone": "(419) 282-4242", "fax": "", "address": "142 W 2nd St, Ashland, OH 44805"},
    {"county_name": "Ashtabula", "phone": "(440) 576-3639", "fax": "", "address": "25 W Jefferson St, Jefferson, OH 44047"},
    {"county_name": "Athens", "phone": "(740) 592-3242", "fax": "", "address": "1 S Court St, 4th Floor, Athens, OH 45701"},
    {"county_name": "Auglaize", "phone": "(419) 739-6769", "fax": "", "address": "201 S Willipie St, Room 043, Wapakoneta, OH 45895"},
    {"county_name": "Belmont", "phone": "(740) 699-2169", "fax": "", "address": "101 W Main St, St. Clairsville, OH 43950"},
    {"county_name": "Brown", "phone": "(937) 378-3100", "fax": "", "address": "101 S Main St, Georgetown, OH 45121"},
    {"county_name": "Butler", "phone": "(513) 887-3282", "fax": "", "address": "315 High St, 5th Floor, Hamilton, OH 45011"},
    {"county_name": "Carroll", "phone": "(330) 627-4886", "fax": "", "address": "119 S Lisbon St, Ste 401, Carrollton, OH 44615"},
    {"county_name": "Champaign", "phone": "(937) 484-1046", "fax": "", "address": "200 N Main St, Urbana, OH 43078"},
    {"county_name": "Clark", "phone": "(937) 521-1699", "fax": "", "address": "101 N Limestone St, Ste 210, Springfield, OH 45502"},
    {"county_name": "Clermont", "phone": "(513) 732-7332", "fax": "", "address": "270 Main St, Batavia, OH 45103"},
    {"county_name": "Clinton", "phone": "(937) 382-2316", "fax": "", "address": "46 S South St, Suite 333, Wilmington, OH 45177"},
    {"county_name": "Columbiana", "phone": "(330) 424-6678", "fax": "", "address": "105 S Market St, Lisbon, OH 44432"},
    {"county_name": "Coshocton", "phone": "(740) 295-7431", "fax": "", "address": "318 Main St, 2nd Floor, Coshocton, OH 43812"},
    {"county_name": "Crawford", "phone": "(419) 563-1972", "fax": "", "address": "112 E Mansfield St, Suite 204, Bucyrus, OH 44820"},
    {"county_name": "Cuyahoga", "phone": "(216) 443-7148", "fax": "", "address": "1200 Ontario St, Cleveland, OH 44113"},
    {"county_name": "Darke", "phone": "(937) 547-7336", "fax": "", "address": "504 S Broadway, Ste 10, Greenville, OH 45331"},
    {"county_name": "Defiance", "phone": "(419) 782-1936", "fax": "", "address": "221 Clinton St, Defiance, OH 43512"},
    {"county_name": "Delaware", "phone": "(740) 833-2515", "fax": "", "address": "117 N Union St, Level 300, Delaware, OH 43015"},
    {"county_name": "Erie", "phone": "(419) 624-6428", "fax": "", "address": "323 Columbus Ave, Sandusky, OH 44870"},
    {"county_name": "Fairfield", "phone": "(740) 652-7356", "fax": "", "address": "224 E Main St, Lancaster, OH 43130"},
    {"county_name": "Fayette", "phone": "(740) 335-6371", "fax": "", "address": "110 E Court St, Washington Court House, OH 43160"},
    {"county_name": "Franklin", "phone": "(614) 525-3600", "fax": "", "address": "373 S High St, Floor 23, Columbus, OH 43215"},
    {"county_name": "Fulton", "phone": "(419) 337-9231", "fax": "", "address": "210 S Fulton St, Room 102, Wauseon, OH 43567"},
    {"county_name": "Gallia", "phone": "(740) 446-3892", "fax": "", "address": "18 Locust St, Room 1290, Gallipolis, OH 45631"},
    {"county_name": "Geauga", "phone": "(440) 279-1966", "fax": "", "address": "100 Short Court St, Suite 300, Chardon, OH 44024"},
    {"county_name": "Greene", "phone": "(937) 562-5295", "fax": "", "address": "45 N Detroit St, Xenia, OH 45385"},
    {"county_name": "Guernsey", "phone": "(740) 432-9232", "fax": "", "address": "801 Wheeling Ave, Cambridge, OH 43725"},
    {"county_name": "Hamilton", "phone": "(513) 946-5656", "fax": "", "address": "1000 Main St, Room 375, Cincinnati, OH 45202"},
    {"county_name": "Hancock", "phone": "(419) 424-7039", "fax": "", "address": "300 S Main St, Findlay, OH 45840"},
    {"county_name": "Hardin", "phone": "(419) 674-2278", "fax": "", "address": "One Public Courthouse Sq, Suite 310, Kenton, OH 43326"},
    {"county_name": "Harrison", "phone": "(740) 942-8541", "fax": "", "address": "100 W Market St, Cadiz, OH 43907"},
    {"county_name": "Henry", "phone": "(419) 592-5886", "fax": "", "address": "660 N Perry St, Suite 302, Napoleon, OH 43545"},
    {"county_name": "Highland", "phone": "(937) 393-9957", "fax": "", "address": "105 N High St, Hillsboro, OH 45133"},
    {"county_name": "Hocking", "phone": "(740) 385-2616", "fax": "", "address": "1 Main St, Logan, OH 43138"},
    {"county_name": "Holmes", "phone": "(330) 674-1876", "fax": "", "address": "1 E Jackson St, Ste 306, Millersburg, OH 44654"},
    {"county_name": "Huron", "phone": "(419) 668-5113", "fax": "", "address": "2 E Main St, Norwalk, OH 44857"},
    {"county_name": "Jackson", "phone": "(740) 286-2006", "fax": "", "address": "226 E Main St, Jackson, OH 45640"},
    {"county_name": "Jefferson", "phone": "(740) 283-8510", "fax": "", "address": "301 Market St, Steubenville, OH 43952"},
    {"county_name": "Knox", "phone": "(740) 393-6785", "fax": "", "address": "117 E High St, Mt. Vernon, OH 43050"},
    {"county_name": "Lake", "phone": "(440) 350-2055", "fax": "", "address": "25 N Park Place, Painesville, OH 44077"},
    {"county_name": "Lawrence", "phone": "(740) 533-4352", "fax": "", "address": "111 S 4th St, Ironton, OH 45638"},
    {"county_name": "Licking", "phone": "(740) 670-5390", "fax": "", "address": "1 Courthouse Sq, 2nd Floor, Newark, OH 43055"},
    {"county_name": "Logan", "phone": "(937) 599-7294", "fax": "", "address": "101 S Main St, Room 218, Bellefontaine, OH 43311"},
    {"county_name": "Lorain", "phone": "(440) 329-5492", "fax": "", "address": "225 Court St, 1st Floor, Elyria, OH 44035"},
    {"county_name": "Lucas", "phone": "(419) 213-4405", "fax": "", "address": "700 Adams St, Toledo, OH 43604"},
    {"county_name": "Madison", "phone": "(740) 852-9776", "fax": "", "address": "1 N Main St, London, OH 43140"},
    {"county_name": "Mahoning", "phone": "(330) 740-2104", "fax": "", "address": "102 Market St, Youngstown, OH 44503"},
    {"county_name": "Marion", "phone": "(740) 223-4270", "fax": "", "address": "100 N Main St, Marion, OH 43301"},
    {"county_name": "Medina", "phone": "(330) 725-9722", "fax": "", "address": "93 Public Sq, Medina, OH 44256"},
    {"county_name": "Meigs", "phone": "(440) 992-5290", "fax": "", "address": "100 Second St, Ste 303, Pomeroy, OH 45769"},
    {"county_name": "Mercer", "phone": "(419) 586-6461", "fax": "", "address": "101 N Main St, Rm 205, Celina, OH 45822"},
    {"county_name": "Miami", "phone": "(937) 440-6012", "fax": "", "address": "201 W Main St, 3rd Floor, Troy, OH 45373"},
    {"county_name": "Monroe", "phone": "(740) 472-6001", "fax": "", "address": "101 N Main St, Room 26, Woodsfield, OH 43793"},
    {"county_name": "Montgomery", "phone": "(937) 496-3144", "fax": "", "address": "41 N Perry St, Room 104, Dayton, OH 45422"},
    {"county_name": "Morgan", "phone": "(740) 962-1386", "fax": "", "address": "19 E Main St, McConnelsville, OH 43756"},
    {"county_name": "Morrow", "phone": "(419) 947-2085", "fax": "", "address": "48 E High St, Room 6, Mt. Gilead, OH 43338"},
    {"county_name": "Muskingum", "phone": "(740) 455-7104", "fax": "", "address": "401 Main St, Zanesville, OH 43702"},
    {"county_name": "Noble", "phone": "(740) 732-5604", "fax": "", "address": "350 Courthouse, Caldwell, OH 43724"},
    {"county_name": "Ottawa", "phone": "(419) 734-6756", "fax": "", "address": "315 Madison St, Room 304, Port Clinton, OH 43452"},
    {"county_name": "Paulding", "phone": "(419) 399-8210", "fax": "", "address": "115 N Williams St, Room 104, Paulding, OH 45879"},
    {"county_name": "Perry", "phone": "", "fax": "(740) 342-5527", "address": "105 N Main St, New Lexington, OH 43764"},
    {"county_name": "Pickaway", "phone": "(740) 474-5410", "fax": "", "address": "207 S Court St, Circleville, OH 43113"},
    {"county_name": "Pike", "phone": "(740) 947-2715", "fax": "", "address": "100 E Second St, 2nd Floor, Waverly, OH 45690"},
    {"county_name": "Portage", "phone": "(330) 298-3049", "fax": "", "address": "203 W Main St, Ravenna, OH 44266"},
    {"county_name": "Preble", "phone": "(937) 456-8159", "fax": "", "address": "101 E Main St, Eaton, OH 45320"},
    {"county_name": "Putnam", "phone": "(419) 523-8733", "fax": "", "address": "245 E Main St, Ste 301, Ottawa, OH 45875"},
    {"county_name": "Richland", "phone": "(419) 774-5549", "fax": "", "address": "50 Park Ave E, Mansfield, OH 44902"},
    {"county_name": "Ross", "phone": "(740) 702-3020", "fax": "", "address": "2 N Paint St, Ste B, Chillicothe, OH 45601"},
    {"county_name": "Sandusky", "phone": "(419) 334-6151", "fax": "", "address": "100 N Park Ave, Suite 320, Fremont, OH 43420"},
    {"county_name": "Scioto", "phone": "(740) 355-8218", "fax": "", "address": "602 7th St, Room 205, Portsmouth, OH 45662"},
    {"county_name": "Seneca", "phone": "(419) 448-5712", "fax": "", "address": "103 E Market St, Ste 101, Tiffin, OH 44883"},
    {"county_name": "Shelby", "phone": "(937) 498-7225", "fax": "", "address": "100 E Court St, 3rd Floor, Sidney, OH 45365"},
    {"county_name": "Stark", "phone": "(330) 451-7622", "fax": "", "address": "110 Central Plaza S, Suite 160, Canton, OH 44701"},
    {"county_name": "Summit", "phone": "(330) 643-2210", "fax": "", "address": "205 S High St, Akron, OH 44308"},
    {"county_name": "Trumbull", "phone": "(330) 675-2561", "fax": "", "address": "161 High St NW, Warren, OH 44481"},
    {"county_name": "Tuscarawas", "phone": "(330) 365-3260", "fax": "", "address": "125 E High Ave, New Philadelphia, OH 44663"},
    {"county_name": "Union", "phone": "(937) 645-3182", "fax": "", "address": "215 W Fifth St, Marysville, OH 43040"},
    {"county_name": "Van Wert", "phone": "(419) 238-2560", "fax": "", "address": "121 E Main St, 3rd Floor, Van Wert, OH 45891"},
    {"county_name": "Vinton", "phone": "(740) 596-3001", "fax": "", "address": "100 E Main St, McArthur, OH 45641"},
    {"county_name": "Warren", "phone": "(513) 695-1869", "fax": "", "address": "500 Justice Dr, Lebanon, OH 45036"},
    {"county_name": "Washington", "phone": "(740) 373-6623", "fax": "", "address": "205 Putnam St, Marietta, OH 45750"},
    {"county_name": "Wayne", "phone": "(330) 264-3247", "fax": "", "address": "215 N Grant St, Wooster, OH 44691"},
    {"county_name": "Williams", "phone": "(419) 633-5116", "fax": "", "address": "1 Courthouse Sq, Bryan, OH 43506"},
    {"county_name": "Wood", "phone": "(419) 354-9286", "fax": "", "address": "1 Courthouse Sq, Bowling Green, OH 43402"},
    {"county_name": "Wyandot", "phone": "(419) 294-6441", "fax": "", "address": "109 S Sandusky Ave, Room 31, Upper Sandusky, OH 43351"},
]

# Partial North Carolina data (from searches)
NC_COUNTIES = [
    {"county_name": "Alamance", "phone": "(336) 570-5202", "fax": "(336) 570-5343", "address": "212 West Elm Street, Graham, NC 27253"},
    {"county_name": "Alexander", "phone": "(828) 635-3113", "fax": "(828) 635-3101", "address": "29 West Main Street, Taylorsville, NC 28681"},
    {"county_name": "Alleghany", "phone": "(336) 372-3900", "fax": "(336) 372-3901", "address": "12 North Main Street, Sparta, NC 28675"},
    {"county_name": "Anson", "phone": "(704) 994-3800", "fax": "(704) 994-3801", "address": "114 North Greene Street, Wadesboro, NC 28170"},
    {"county_name": "Ashe", "phone": "(336) 219-1400", "fax": "(336) 219-1401", "address": "150 Government Circle Suite 3100, Jefferson, NC 28640"},
    {"county_name": "Avery", "phone": "(828) 737-6700", "fax": "(828) 737-6701", "address": "200 Montezuma Street, Newland, NC 28657"},
    {"county_name": "Beaufort", "phone": "(252) 946-2910", "fax": "(252) 946-2911", "address": "119 East Queen Street, Washington, NC 27889"},
    {"county_name": "Bertie", "phone": "(252) 209-2240", "fax": "(252) 209-2241", "address": "100 Bertie Square, Windsor, NC 27983"},
    {"county_name": "Bladen", "phone": "(910) 862-3100", "fax": "(910) 862-3101", "address": "302 Court Street, Elizabethtown, NC 28337"},
    {"county_name": "Brunswick", "phone": "(910) 253-2040", "fax": "(910) 253-2041", "address": "211 North Howe Street, Bolivia, NC 28422"},
    {"county_name": "Buncombe", "phone": "(828) 259-3400", "fax": "", "address": "200 College Street, Asheville, NC 28801"},
    {"county_name": "Duplin", "phone": "(910) 275-7000", "fax": "(910) 275-7001", "address": "112 Duplin Street, Kenansville, NC 28349"},
]

def create_nc_stub_counties():
    """Create stub entries for remaining NC counties not yet researched."""
    nc_all = [
        "Alamance", "Alexander", "Alleghany", "Anson", "Ashe", "Avery",
        "Beaufort", "Bertie", "Bladen", "Brunswick", "Buncombe", "Burke",
        "Cabarrus", "Caldwell", "Camden", "Carteret", "Caswell", "Catawba",
        "Chatham", "Cherokee", "Chowan", "Clay", "Cleveland", "Columbus",
        "Craven", "Cumberland", "Currituck", "Dare", "Davidson", "Davie",
        "Duplin", "Durham", "Edgecombe", "Forsyth", "Franklin", "Gaston",
        "Gates", "Graham", "Granville", "Greene", "Guilford", "Halifax",
        "Harnett", "Haywood", "Henderson", "Hertford", "Hoke", "Hyde",
        "Iredell", "Jackson", "Johnston", "Jones", "Lee", "Lenoir",
        "Lincoln", "Macon", "Madison", "Martin", "McDowell", "Mecklenburg",
        "Mitchell", "Montgomery", "Moore", "Nash", "New Hanover", "Northampton",
        "Onslow", "Orange", "Pamlico", "Pasquotank", "Pender", "Perquimans",
        "Person", "Pitt", "Polk", "Randolph", "Richmond", "Robeson",
        "Rockingham", "Rowan", "Rutherford", "Sampson", "Scotland", "Stanly",
        "Stokes", "Surry", "Swain", "Transylvania", "Tyrrell", "Union",
        "Vance", "Wake", "Warren", "Washington", "Watauga", "Wayne",
        "Wilkes", "Wilson", "Yadkin", "Yancey"
    ]

    known_counties = {c["county_name"] for c in NC_COUNTIES}
    stub_counties = []

    for county_name in nc_all:
        if county_name not in known_counties:
            stub_counties.append({
                "county_name": county_name,
                "clerk_website": "",
                "efiling_url": "",
                "phone": "",
                "fax": "",
                "address": "",
                "research_status": "NEEDS_RESEARCH"
            })

    return stub_counties

def create_output():
    """Create the final JSON output structure."""

    # Complete NY counties
    ny_full = []
    for county in NY_COUNTIES:
        ny_full.append({
            "county_name": county["county_name"],
            "clerk_website": county.get("clerk_website", ""),
            "efiling_url": "",
            "phone": county.get("phone", ""),
            "fax": county.get("fax", ""),
            "address": county.get("address", ""),
            "research_status": "COMPLETE"
        })

    # Complete OH counties
    oh_full = []
    for county in OH_COUNTIES:
        oh_full.append({
            "county_name": county["county_name"],
            "clerk_website": county.get("clerk_website", ""),
            "efiling_url": "",
            "phone": county.get("phone", ""),
            "fax": county.get("fax", ""),
            "address": county.get("address", ""),
            "research_status": "COMPLETE"
        })

    # Partial NC counties + stubs
    nc_full = []
    for county in NC_COUNTIES:
        nc_full.append({
            "county_name": county["county_name"],
            "clerk_website": county.get("clerk_website", ""),
            "efiling_url": "",
            "phone": county.get("phone", ""),
            "fax": county.get("fax", ""),
            "address": county.get("address", ""),
            "research_status": "PARTIAL"
        })

    # Add stub entries for remaining NC counties
    nc_full.extend(create_nc_stub_counties())
    nc_full.sort(key=lambda x: x["county_name"])

    output = [
        {
            "state_abbr": "NC",
            "state_name": "North Carolina",
            "statewide_efiling_system": "Odyssey eFileNC",
            "statewide_efiling_url": "https://northcarolina.tylertech.cloud/ofsweb",
            "counties": nc_full
        },
        {
            "state_abbr": "NY",
            "state_name": "New York",
            "statewide_efiling_system": "NYSCEF",
            "statewide_efiling_url": "https://iapps.courts.state.ny.us/nyscef/HomePage",
            "counties": ny_full
        },
        {
            "state_abbr": "OH",
            "state_name": "Ohio",
            "statewide_efiling_system": "eFileOH (varies by county)",
            "statewide_efiling_url": "https://www.supremecourt.ohio.gov/courts/common-pleas/",
            "counties": oh_full
        }
    ]

    return output

if __name__ == "__main__":
    output_file = "/mnt/c/Users/flowc/Documents/foreclosure-leads-app/data/county-court-data/enriched-batch-A.json"

    print("Compiling county clerk of court data...")
    data = create_output()

    # Statistics
    total_complete = sum(len([c for c in state["counties"] if c["research_status"] == "COMPLETE"]) for state in data)
    total_partial = sum(len([c for c in state["counties"] if c["research_status"] == "PARTIAL"]) for state in data)
    total_needs = sum(len([c for c in state["counties"] if c["research_status"] == "NEEDS_RESEARCH"]) for state in data)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nData compiled and saved to: {output_file}")
    print(f"\nResearch Status Summary:")
    print(f"  Complete: {total_complete} counties")
    print(f"  Partial: {total_partial} counties")
    print(f"  Needs Research: {total_needs} counties")
    print(f"  Total: {total_complete + total_partial + total_needs} counties")

    # Breakdown by state
    print(f"\nBreakdown by state:")
    for state in data:
        complete = len([c for c in state["counties"] if c["research_status"] == "COMPLETE"])
        partial = len([c for c in state["counties"] if c["research_status"] == "PARTIAL"])
        needs = len([c for c in state["counties"] if c["research_status"] == "NEEDS_RESEARCH"])
        total = len(state["counties"])
        print(f"  {state['state_abbr']}: {complete} complete, {partial} partial, {needs} needs research (Total: {total})")
