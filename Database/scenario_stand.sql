DO
$$
    DECLARE
        _zone bigint;
    BEGIN
        SELECT zones.id INTO _zone FROM zones LIMIT 1;
        INSERT INTO public.addresses (name, type, zone, x, y, z)
        VALUES ('Стол-1', 'DESK', _zone, 6812, 680, -1208),
               ('А-1-1', 'ODD_CELL', _zone, 634, 680, 1190),
               ('А-1-2', 'EVEN_CELL', _zone, 1538, 680, 1190),
               ('А-1-3', 'ODD_CELL', _zone, 2542, 680, 1190),
               ('А-1-4', 'EVEN_CELL', _zone, 3445, 680, 1190),
               ('А-1-5', 'ODD_CELL', _zone, 4451, 680, 1190),
               ('А-1-6', 'EVEN_CELL', _zone, 5352, 680, 1190),
               ('А-1-7', 'ODD_CELL', _zone, 6359, 680, 1190),
               ('А-1-8', 'EVEN_CELL', _zone, 7265, 680, 1190),
               ('А-1-9', 'ODD_CELL', _zone, 8270, 680, 1190),
               ('А-1-10', 'EVEN_CELL', _zone, 9171, 680, 1190),
               ('А-1-11', 'ODD_CELL', _zone, 10175, 680, 1190),
               ('А-1-12', 'EVEN_CELL', _zone, 11078, 680, 1190),
               ('А-1-13', 'ODD_CELL', _zone, 12083, 680, 1190),
               ('А-1-14', 'EVEN_CELL', _zone, 12985, 680, 1190),
               ('А-2-1', 'ODD_CELL', _zone, 633, 1229, 1190),
               ('А-2-2', 'EVEN_CELL', _zone, 1538, 1229, 1190),
               ('А-2-3', 'ODD_CELL', _zone, 2541, 1229, 1190),
               ('А-2-4', 'EVEN_CELL', _zone, 3444, 1229, 1190),
               ('А-2-5', 'ODD_CELL', _zone, 4449, 1229, 1190),
               ('А-2-6', 'EVEN_CELL', _zone, 5351, 1229, 1190),
               ('А-2-7', 'ODD_CELL', _zone, 6357, 1229, 1190),
               ('А-2-8', 'EVEN_CELL', _zone, 7262, 1229, 1190),
               ('А-2-9', 'ODD_CELL', _zone, 8267, 1229, 1190),
               ('А-2-10', 'EVEN_CELL', _zone, 9169, 1229, 1190),
               ('А-2-11', 'ODD_CELL', _zone, 10174, 1229, 1190),
               ('А-2-12', 'EVEN_CELL', _zone, 11078, 1229, 1190),
               ('А-2-13', 'ODD_CELL', _zone, 12082, 1229, 1190),
               ('А-2-14', 'EVEN_CELL', _zone, 12984, 1229, 1190),
               ('А-3-1', 'ODD_CELL', _zone, 632, 1779, 1190),
               ('А-3-2', 'EVEN_CELL', _zone, 1537, 1779, 1190),
               ('А-3-3', 'ODD_CELL', _zone, 2540, 1779, 1190),
               ('А-3-4', 'EVEN_CELL', _zone, 3444, 1779, 1190),
               ('А-3-5', 'ODD_CELL', _zone, 4446, 1779, 1190),
               ('А-3-6', 'EVEN_CELL', _zone, 5350, 1779, 1190),
               ('А-3-7', 'ODD_CELL', _zone, 6355, 1779, 1190),
               ('А-3-8', 'EVEN_CELL', _zone, 7259, 1779, 1190),
               ('А-3-9', 'ODD_CELL', _zone, 8265, 1779, 1190),
               ('А-3-10', 'EVEN_CELL', _zone, 9168, 1779, 1190),
               ('А-3-11', 'ODD_CELL', _zone, 10173, 1779, 1190),
               ('А-3-12', 'EVEN_CELL', _zone, 11078, 1779, 1190),
               ('А-3-13', 'ODD_CELL', _zone, 12081, 1779, 1190),
               ('А-3-14', 'EVEN_CELL', _zone, 12982, 1779, 1190),
               ('А-4-1', 'ODD_CELL', _zone, 632, 2328, 1190),
               ('А-4-2', 'EVEN_CELL', _zone, 1537, 2328, 1190),
               ('А-4-3', 'ODD_CELL', _zone, 2539, 2328, 1190),
               ('А-4-4', 'EVEN_CELL', _zone, 3441, 2328, 1190),
               ('А-4-5', 'ODD_CELL', _zone, 4445, 2328, 1190),
               ('А-4-6', 'EVEN_CELL', _zone, 5349, 2328, 1190),
               ('А-4-7', 'ODD_CELL', _zone, 6354, 2328, 1190),
               ('А-4-8', 'EVEN_CELL', _zone, 7259, 2328, 1190),
               ('А-4-9', 'ODD_CELL', _zone, 8266, 2328, 1190),
               ('А-4-10', 'EVEN_CELL', _zone, 9169, 2328, 1190),
               ('А-4-11', 'ODD_CELL', _zone, 10173, 2328, 1190),
               ('А-4-12', 'EVEN_CELL', _zone, 11075, 2328, 1190),
               ('А-4-13', 'ODD_CELL', _zone, 12080, 2328, 1190),
               ('А-4-14', 'EVEN_CELL', _zone, 12982, 2328, 1190),
               ('А-5-1', 'ODD_CELL', _zone, 632, 2877, 1190),
               ('А-5-2', 'EVEN_CELL', _zone, 1537, 2877, 1190),
               ('А-5-3', 'ODD_CELL', _zone, 2537, 2877, 1190),
               ('А-5-4', 'EVEN_CELL', _zone, 3439, 2877, 1190),
               ('А-5-5', 'ODD_CELL', _zone, 4444, 2877, 1190),
               ('А-5-6', 'EVEN_CELL', _zone, 5348, 2877, 1190),
               ('А-5-7', 'ODD_CELL', _zone, 6353, 2877, 1190),
               ('А-5-8', 'EVEN_CELL', _zone, 7260, 2877, 1190),
               ('А-5-9', 'ODD_CELL', _zone, 8268, 2877, 1190),
               ('А-5-10', 'EVEN_CELL', _zone, 9170, 2877, 1190),
               ('А-5-11', 'ODD_CELL', _zone, 10173, 2877, 1190),
               ('А-5-12', 'EVEN_CELL', _zone, 11073, 2877, 1190),
               ('А-5-13', 'ODD_CELL', _zone, 12078, 2877, 1190),
               ('А-5-14', 'EVEN_CELL', _zone, 12981, 2877, 1190),
               ('А-6-1', 'ODD_CELL', _zone, 632, 3426, 1190),
               ('А-6-2', 'EVEN_CELL', _zone, 1539, 3426, 1190),
               ('А-6-3', 'ODD_CELL', _zone, 2538, 3426, 1190),
               ('А-6-4', 'EVEN_CELL', _zone, 3440, 3426, 1190),
               ('А-6-5', 'ODD_CELL', _zone, 4443, 3426, 1190),
               ('А-6-6', 'EVEN_CELL', _zone, 5348, 3426, 1190),
               ('А-6-7', 'ODD_CELL', _zone, 6353, 3426, 1190),
               ('А-6-8', 'EVEN_CELL', _zone, 7260, 3426, 1190),
               ('А-6-9', 'ODD_CELL', _zone, 8267, 3426, 1190),
               ('А-6-10', 'EVEN_CELL', _zone, 9170, 3426, 1190),
               ('А-6-11', 'ODD_CELL', _zone, 10174, 3426, 1190),
               ('А-6-12', 'EVEN_CELL', _zone, 11074, 3426, 1190),
               ('А-6-13', 'ODD_CELL', _zone, 12079, 3426, 1190),
               ('А-6-14', 'EVEN_CELL', _zone, 12981, 3426, 1190),
               ('А-7-1', 'ODD_CELL', _zone, 633, 3976, 1190),
               ('А-7-2', 'EVEN_CELL', _zone, 1541, 3976, 1190),
               ('А-7-3', 'ODD_CELL', _zone, 2538, 3976, 1190),
               ('А-7-4', 'EVEN_CELL', _zone, 3441, 3976, 1190),
               ('А-7-5', 'ODD_CELL', _zone, 4442, 3976, 1190),
               ('А-7-6', 'EVEN_CELL', _zone, 5347, 3976, 1190),
               ('А-7-7', 'ODD_CELL', _zone, 6352, 3976, 1190),
               ('А-7-8', 'EVEN_CELL', _zone, 7260, 3976, 1190),
               ('А-7-9', 'ODD_CELL', _zone, 8266, 3976, 1190),
               ('А-7-10', 'EVEN_CELL', _zone, 9171, 3976, 1190),
               ('А-7-11', 'ODD_CELL', _zone, 10176, 3976, 1190),
               ('А-7-12', 'EVEN_CELL', _zone, 11075, 3976, 1190),
               ('А-7-13', 'ODD_CELL', _zone, 12081, 3976, 1190),
               ('А-7-14', 'EVEN_CELL', _zone, 12980, 3976, 1190),
               ('А-8-1', 'ODD_CELL', _zone, 635, 4525, 1190),
               ('А-8-2', 'EVEN_CELL', _zone, 1542, 4525, 1190),
               ('А-8-3', 'ODD_CELL', _zone, 2539, 4525, 1190),
               ('А-8-4', 'EVEN_CELL', _zone, 3440, 4525, 1190),
               ('А-8-5', 'ODD_CELL', _zone, 4442, 4525, 1190),
               ('А-8-6', 'EVEN_CELL', _zone, 5347, 4525, 1190),
               ('А-8-7', 'ODD_CELL', _zone, 6353, 4525, 1190),
               ('А-8-8', 'EVEN_CELL', _zone, 7262, 4525, 1190),
               ('А-8-9', 'ODD_CELL', _zone, 8268, 4525, 1190),
               ('А-8-10', 'EVEN_CELL', _zone, 9173, 4525, 1190),
               ('А-8-11', 'ODD_CELL', _zone, 10176, 4525, 1190),
               ('А-8-12', 'EVEN_CELL', _zone, 11077, 4525, 1190),
               ('А-8-13', 'ODD_CELL', _zone, 12081, 4525, 1190),
               ('А-8-14', 'EVEN_CELL', _zone, 12982, 4525, 1190),
               ('А-9-1', 'ODD_CELL', _zone, 637, 5074, 1190),
               ('А-9-2', 'EVEN_CELL', _zone, 1544, 5074, 1190),
               ('А-9-3', 'ODD_CELL', _zone, 2540, 5074, 1190),
               ('А-9-4', 'EVEN_CELL', _zone, 3439, 5074, 1190),
               ('А-9-5', 'ODD_CELL', _zone, 4442, 5074, 1190),
               ('А-9-6', 'EVEN_CELL', _zone, 5346, 5074, 1190),
               ('А-9-7', 'ODD_CELL', _zone, 6355, 5074, 1190),
               ('А-9-8', 'EVEN_CELL', _zone, 7263, 5074, 1190),
               ('А-9-9', 'ODD_CELL', _zone, 8270, 5074, 1190),
               ('А-9-10', 'EVEN_CELL', _zone, 9175, 5074, 1190),
               ('А-9-11', 'ODD_CELL', _zone, 10176, 5074, 1190),
               ('А-9-12', 'EVEN_CELL', _zone, 11078, 5074, 1190),
               ('А-9-13', 'ODD_CELL', _zone, 12081, 5074, 1190),
               ('А-9-14', 'EVEN_CELL', _zone, 12985, 5074, 1190),
               ('А-10-1', 'ODD_CELL', _zone, 637, 5624, 1190),
               ('А-10-2', 'EVEN_CELL', _zone, 1544, 5624, 1190),
               ('А-10-3', 'ODD_CELL', _zone, 2539, 5624, 1190),
               ('А-10-4', 'EVEN_CELL', _zone, 3438, 5624, 1190),
               ('А-10-5', 'ODD_CELL', _zone, 4441, 5624, 1190),
               ('А-10-6', 'EVEN_CELL', _zone, 5347, 5624, 1190),
               ('А-10-7', 'ODD_CELL', _zone, 6354, 5624, 1190),
               ('А-10-8', 'EVEN_CELL', _zone, 7265, 5624, 1190),
               ('А-10-9', 'ODD_CELL', _zone, 8272, 5624, 1190),
               ('А-10-10', 'EVEN_CELL', _zone, 9175, 5624, 1190),
               ('А-10-11', 'ODD_CELL', _zone, 10176, 5624, 1190),
               ('А-10-12', 'EVEN_CELL', _zone, 11078, 5624, 1190),
               ('А-10-13', 'ODD_CELL', _zone, 12078, 5624, 1190),
               ('А-10-14', 'EVEN_CELL', _zone, 12981, 5624, 1190),
               ('А-11-1', 'ODD_CELL', _zone, 638, 6173, 1190),
               ('А-11-2', 'EVEN_CELL', _zone, 1545, 6173, 1190),
               ('А-11-3', 'ODD_CELL', _zone, 2539, 6173, 1190),
               ('А-11-4', 'EVEN_CELL', _zone, 3437, 6173, 1190),
               ('А-11-5', 'ODD_CELL', _zone, 4439, 6173, 1190),
               ('А-11-6', 'EVEN_CELL', _zone, 5345, 6173, 1190),
               ('А-11-7', 'ODD_CELL', _zone, 6354, 6173, 1190),
               ('А-11-8', 'EVEN_CELL', _zone, 7263, 6173, 1190),
               ('А-11-9', 'ODD_CELL', _zone, 8271, 6173, 1190),
               ('А-11-10', 'EVEN_CELL', _zone, 9175, 6173, 1190),
               ('А-11-11', 'ODD_CELL', _zone, 10178, 6173, 1190),
               ('А-11-12', 'EVEN_CELL', _zone, 11080, 6173, 1190),
               ('А-11-13', 'ODD_CELL', _zone, 12085, 6173, 1190),
               ('А-11-14', 'EVEN_CELL', _zone, 12981, 6173, 1190),
               ('А-12-1', 'ODD_CELL', _zone, 639, 6722, 1190),
               ('А-12-2', 'EVEN_CELL', _zone, 1546, 6722, 1190),
               ('А-12-3', 'ODD_CELL', _zone, 2541, 6722, 1190),
               ('А-12-4', 'EVEN_CELL', _zone, 3437, 6722, 1190),
               ('А-12-5', 'ODD_CELL', _zone, 4438, 6722, 1190),
               ('А-12-6', 'EVEN_CELL', _zone, 5346, 6722, 1190),
               ('А-12-7', 'ODD_CELL', _zone, 6354, 6722, 1190),
               ('А-12-8', 'EVEN_CELL', _zone, 7263, 6722, 1190),
               ('А-12-9', 'ODD_CELL', _zone, 8272, 6722, 1190),
               ('А-12-10', 'EVEN_CELL', _zone, 9175, 6722, 1190),
               ('А-12-11', 'ODD_CELL', _zone, 10180, 6722, 1190),
               ('А-12-12', 'EVEN_CELL', _zone, 11079, 6722, 1190),
               ('А-12-13', 'ODD_CELL', _zone, 12087, 6722, 1190),
               ('А-12-14', 'EVEN_CELL', _zone, 12982, 6722, 1190),
               ('А-13-1', 'ODD_CELL', _zone, 640, 7271, 1190),
               ('А-13-2', 'EVEN_CELL', _zone, 1547, 7271, 1190),
               ('А-13-3', 'ODD_CELL', _zone, 2542, 7271, 1190),
               ('А-13-4', 'EVEN_CELL', _zone, 3437, 7271, 1190),
               ('А-13-5', 'ODD_CELL', _zone, 4437, 7271, 1190),
               ('А-13-6', 'EVEN_CELL', _zone, 5346, 7271, 1190),
               ('А-13-7', 'ODD_CELL', _zone, 6353, 7271, 1190),
               ('А-13-8', 'EVEN_CELL', _zone, 7264, 7271, 1190),
               ('А-13-9', 'ODD_CELL', _zone, 8272, 7271, 1190),
               ('А-13-10', 'EVEN_CELL', _zone, 9176, 7271, 1190),
               ('А-13-11', 'ODD_CELL', _zone, 10181, 7271, 1190),
               ('А-13-12', 'EVEN_CELL', _zone, 11079, 7271, 1190),
               ('А-13-13', 'ODD_CELL', _zone, 12089, 7271, 1190),
               ('А-13-14', 'EVEN_CELL', _zone, 12983, 7271, 1190),
               ('А-14-1', 'ODD_CELL', _zone, 641, 7821, 1190),
               ('А-14-2', 'EVEN_CELL', _zone, 1548, 7821, 1190),
               ('А-14-3', 'ODD_CELL', _zone, 2541, 7821, 1190),
               ('А-14-4', 'EVEN_CELL', _zone, 3437, 7821, 1190),
               ('А-14-5', 'ODD_CELL', _zone, 4435, 7821, 1190),
               ('А-14-6', 'EVEN_CELL', _zone, 5344, 7821, 1190),
               ('А-14-7', 'ODD_CELL', _zone, 6353, 7821, 1190),
               ('А-14-8', 'EVEN_CELL', _zone, 7264, 7821, 1190),
               ('А-14-9', 'ODD_CELL', _zone, 8274, 7821, 1190),
               ('А-14-10', 'EVEN_CELL', _zone, 9176, 7821, 1190),
               ('А-14-11', 'ODD_CELL', _zone, 10180, 7821, 1190),
               ('А-14-12', 'EVEN_CELL', _zone, 11079, 7821, 1190),
               ('А-14-13', 'ODD_CELL', _zone, 12076, 7821, 1190),
               ('А-14-14', 'EVEN_CELL', _zone, 12982, 7821, 1190),
               ('А-15-1', 'ODD_CELL', _zone, 642, 8370, 1190),
               ('А-15-2', 'EVEN_CELL', _zone, 1549, 8370, 1190),
               ('А-15-3', 'ODD_CELL', _zone, 2540, 8370, 1190),
               ('А-15-4', 'EVEN_CELL', _zone, 3437, 8370, 1190),
               ('А-15-5', 'ODD_CELL', _zone, 4433, 8370, 1190),
               ('А-15-6', 'EVEN_CELL', _zone, 5342, 8370, 1190),
               ('А-15-7', 'ODD_CELL', _zone, 6353, 8370, 1190),
               ('А-15-8', 'EVEN_CELL', _zone, 7264, 8370, 1190),
               ('А-15-9', 'ODD_CELL', _zone, 8273, 8370, 1190),
               ('А-15-10', 'EVEN_CELL', _zone, 9178, 8370, 1190),
               ('А-15-11', 'ODD_CELL', _zone, 10180, 8370, 1190),
               ('А-15-12', 'EVEN_CELL', _zone, 11079, 8370, 1190),
               ('А-15-13', 'ODD_CELL', _zone, 12080, 8370, 1190),
               ('А-15-14', 'EVEN_CELL', _zone, 12981, 8370, 1190),
               ('Б-1-1', 'ODD_CELL', _zone, 637, 680, -1190),
               ('Б-1-2', 'EVEN_CELL', _zone, 1538, 680, -1190),
               ('Б-1-3', 'ODD_CELL', _zone, 2547, 680, -1190),
               ('Б-1-4', 'EVEN_CELL', _zone, 3444, 680, -1190),
               ('Б-1-5', 'ODD_CELL', _zone, 4453, 680, -1190),
               ('Б-1-6', 'EVEN_CELL', _zone, 5352, 680, -1190),
               ('Б-1-9', 'ODD_CELL', _zone, 8272, 680, -1190),
               ('Б-1-10', 'EVEN_CELL', _zone, 9168, 680, -1190),
               ('Б-1-11', 'ODD_CELL', _zone, 10180, 680, -1190),
               ('Б-1-12', 'EVEN_CELL', _zone, 11078, 680, -1190),
               ('Б-1-13', 'ODD_CELL', _zone, 12088, 680, -1190),
               ('Б-1-14', 'EVEN_CELL', _zone, 12987, 680, -1190),
               ('Б-2-1', 'ODD_CELL', _zone, 640, 1229, -1190),
               ('Б-2-2', 'EVEN_CELL', _zone, 1540, 1229, -1190),
               ('Б-2-3', 'ODD_CELL', _zone, 2549, 1229, -1190),
               ('Б-2-4', 'EVEN_CELL', _zone, 3446, 1229, -1190),
               ('Б-2-5', 'ODD_CELL', _zone, 4456, 1229, -1190),
               ('Б-2-6', 'EVEN_CELL', _zone, 5355, 1229, -1190),
               ('Б-2-9', 'ODD_CELL', _zone, 8273, 1229, -1190),
               ('Б-2-10', 'EVEN_CELL', _zone, 9171, 1229, -1190),
               ('Б-2-11', 'ODD_CELL', _zone, 10183, 1229, -1190),
               ('Б-2-12', 'EVEN_CELL', _zone, 11081, 1229, -1190),
               ('Б-2-13', 'ODD_CELL', _zone, 12090, 1229, -1190),
               ('Б-2-14', 'EVEN_CELL', _zone, 12988, 1229, -1190),
               ('Б-3-1', 'ODD_CELL', _zone, 642, 1779, -1190),
               ('Б-3-2', 'EVEN_CELL', _zone, 1541, 1779, -1190),
               ('Б-3-3', 'ODD_CELL', _zone, 2550, 1779, -1190),
               ('Б-3-4', 'EVEN_CELL', _zone, 3448, 1779, -1190),
               ('Б-3-5', 'ODD_CELL', _zone, 4458, 1779, -1190),
               ('Б-3-6', 'EVEN_CELL', _zone, 5357, 1779, -1190),
               ('Б-3-7', 'ODD_CELL', _zone, 6366, 1779, -1190),
               ('Б-3-8', 'EVEN_CELL', _zone, 7264, 1779, -1190),
               ('Б-3-9', 'ODD_CELL', _zone, 8274, 1779, -1190),
               ('Б-3-10', 'EVEN_CELL', _zone, 9175, 1779, -1190),
               ('Б-3-11', 'ODD_CELL', _zone, 10185, 1779, -1190),
               ('Б-3-12', 'EVEN_CELL', _zone, 11083, 1779, -1190),
               ('Б-3-13', 'ODD_CELL', _zone, 12092, 1779, -1190),
               ('Б-3-14', 'EVEN_CELL', _zone, 12989, 1779, -1190),
               ('Б-4-1', 'ODD_CELL', _zone, 643, 2328, -1190),
               ('Б-4-2', 'EVEN_CELL', _zone, 1542, 2328, -1190),
               ('Б-4-3', 'ODD_CELL', _zone, 2550, 2328, -1190),
               ('Б-4-4', 'EVEN_CELL', _zone, 3448, 2328, -1190),
               ('Б-4-5', 'ODD_CELL', _zone, 4458, 2328, -1190),
               ('Б-4-6', 'EVEN_CELL', _zone, 5357, 2328, -1190),
               ('Б-4-7', 'ODD_CELL', _zone, 6366, 2328, -1190),
               ('Б-4-8', 'EVEN_CELL', _zone, 7264, 2328, -1190),
               ('Б-4-9', 'ODD_CELL', _zone, 8275, 2328, -1190),
               ('Б-4-10', 'EVEN_CELL', _zone, 9175, 2328, -1190),
               ('Б-4-11', 'ODD_CELL', _zone, 10185, 2328, -1190),
               ('Б-4-12', 'EVEN_CELL', _zone, 11083, 2328, -1190),
               ('Б-4-13', 'ODD_CELL', _zone, 12093, 2328, -1190),
               ('Б-4-14', 'EVEN_CELL', _zone, 12989, 2328, -1190),
               ('Б-5-1', 'ODD_CELL', _zone, 645, 2877, -1190),
               ('Б-5-2', 'EVEN_CELL', _zone, 1543, 2877, -1190),
               ('Б-5-3', 'ODD_CELL', _zone, 2551, 2877, -1190),
               ('Б-5-4', 'EVEN_CELL', _zone, 3447, 2877, -1190),
               ('Б-5-5', 'ODD_CELL', _zone, 4458, 2877, -1190),
               ('Б-5-6', 'EVEN_CELL', _zone, 5356, 2877, -1190),
               ('Б-5-7', 'ODD_CELL', _zone, 6366, 2877, -1190),
               ('Б-5-8', 'EVEN_CELL', _zone, 7265, 2877, -1190),
               ('Б-5-9', 'ODD_CELL', _zone, 8276, 2877, -1190),
               ('Б-5-10', 'EVEN_CELL', _zone, 9174, 2877, -1190),
               ('Б-5-11', 'ODD_CELL', _zone, 10185, 2877, -1190),
               ('Б-5-12', 'EVEN_CELL', _zone, 11083, 2877, -1190),
               ('Б-5-13', 'ODD_CELL', _zone, 12094, 2877, -1190),
               ('Б-5-14', 'EVEN_CELL', _zone, 12989, 2877, -1190),
               ('Б-6-1', 'ODD_CELL', _zone, 645, 3426, -1190),
               ('Б-6-2', 'EVEN_CELL', _zone, 1545, 3426, -1190),
               ('Б-6-3', 'ODD_CELL', _zone, 2553, 3426, -1190),
               ('Б-6-4', 'EVEN_CELL', _zone, 3447, 3426, -1190),
               ('Б-6-5', 'ODD_CELL', _zone, 4457, 3426, -1190),
               ('Б-6-6', 'EVEN_CELL', _zone, 5355, 3426, -1190),
               ('Б-6-7', 'ODD_CELL', _zone, 6367, 3426, -1190),
               ('Б-6-8', 'EVEN_CELL', _zone, 7266, 3426, -1190),
               ('Б-6-9', 'ODD_CELL', _zone, 8276, 3426, -1190),
               ('Б-6-10', 'EVEN_CELL', _zone, 9176, 3426, -1190),
               ('Б-6-11', 'ODD_CELL', _zone, 10187, 3426, -1190),
               ('Б-6-12', 'EVEN_CELL', _zone, 11083, 3426, -1190),
               ('Б-6-13', 'ODD_CELL', _zone, 12095, 3426, -1190),
               ('Б-6-14', 'EVEN_CELL', _zone, 12989, 3426, -1190),
               ('Б-7-1', 'ODD_CELL', _zone, 646, 3976, -1190),
               ('Б-7-2', 'EVEN_CELL', _zone, 1547, 3976, -1190),
               ('Б-7-3', 'ODD_CELL', _zone, 2555, 3976, -1190),
               ('Б-7-4', 'EVEN_CELL', _zone, 3447, 3976, -1190),
               ('Б-7-5', 'ODD_CELL', _zone, 4456, 3976, -1190),
               ('Б-7-6', 'EVEN_CELL', _zone, 5354, 3976, -1190),
               ('Б-7-7', 'ODD_CELL', _zone, 6368, 3976, -1190),
               ('Б-7-8', 'EVEN_CELL', _zone, 7267, 3976, -1190),
               ('Б-7-9', 'ODD_CELL', _zone, 8276, 3976, -1190),
               ('Б-7-10', 'EVEN_CELL', _zone, 9178, 3976, -1190),
               ('Б-7-11', 'ODD_CELL', _zone, 10189, 3976, -1190),
               ('Б-7-12', 'EVEN_CELL', _zone, 11082, 3976, -1190),
               ('Б-7-13', 'ODD_CELL', _zone, 12097, 3976, -1190),
               ('Б-7-14', 'EVEN_CELL', _zone, 12990, 3976, -1190),
               ('Б-8-1', 'ODD_CELL', _zone, 644, 4525, -1190),
               ('Б-8-2', 'EVEN_CELL', _zone, 1546, 4525, -1190),
               ('Б-8-3', 'ODD_CELL', _zone, 2553, 4525, -1190),
               ('Б-8-4', 'EVEN_CELL', _zone, 3444, 4525, -1190),
               ('Б-8-5', 'ODD_CELL', _zone, 4453, 4525, -1190),
               ('Б-8-6', 'EVEN_CELL', _zone, 5352, 4525, -1190),
               ('Б-8-7', 'ODD_CELL', _zone, 6366, 4525, -1190),
               ('Б-8-8', 'EVEN_CELL', _zone, 7265, 4525, -1190),
               ('Б-8-9', 'ODD_CELL', _zone, 8275, 4525, -1190),
               ('Б-8-10', 'EVEN_CELL', _zone, 9175, 4525, -1190),
               ('Б-8-11', 'ODD_CELL', _zone, 10186, 4525, -1190),
               ('Б-8-12', 'EVEN_CELL', _zone, 11081, 4525, -1190),
               ('Б-8-13', 'ODD_CELL', _zone, 12093, 4525, -1190),
               ('Б-8-14', 'EVEN_CELL', _zone, 12988, 4525, -1190),
               ('Б-9-1', 'ODD_CELL', _zone, 642, 5074, -1190),
               ('Б-9-2', 'EVEN_CELL', _zone, 1544, 5074, -1190),
               ('Б-9-3', 'ODD_CELL', _zone, 2551, 5074, -1190),
               ('Б-9-4', 'EVEN_CELL', _zone, 3442, 5074, -1190),
               ('Б-9-5', 'ODD_CELL', _zone, 4449, 5074, -1190),
               ('Б-9-6', 'EVEN_CELL', _zone, 5351, 5074, -1190),
               ('Б-9-7', 'ODD_CELL', _zone, 6364, 5074, -1190),
               ('Б-9-8', 'EVEN_CELL', _zone, 7262, 5074, -1190),
               ('Б-9-9', 'ODD_CELL', _zone, 8274, 5074, -1190),
               ('Б-9-10', 'EVEN_CELL', _zone, 9173, 5074, -1190),
               ('Б-9-11', 'ODD_CELL', _zone, 10183, 5074, -1190),
               ('Б-9-12', 'EVEN_CELL', _zone, 11080, 5074, -1190),
               ('Б-9-13', 'ODD_CELL', _zone, 12089, 5074, -1190),
               ('Б-9-14', 'EVEN_CELL', _zone, 12987, 5074, -1190),
               ('Б-10-1', 'ODD_CELL', _zone, 643, 5624, -1190),
               ('Б-10-2', 'EVEN_CELL', _zone, 1545, 5624, -1190),
               ('Б-10-3', 'ODD_CELL', _zone, 2550, 5624, -1190),
               ('Б-10-4', 'EVEN_CELL', _zone, 3441, 5624, -1190),
               ('Б-10-5', 'ODD_CELL', _zone, 4448, 5624, -1190),
               ('Б-10-6', 'EVEN_CELL', _zone, 5350, 5624, -1190),
               ('Б-10-7', 'ODD_CELL', _zone, 6364, 5624, -1190),
               ('Б-10-8', 'EVEN_CELL', _zone, 7267, 5624, -1190),
               ('Б-10-9', 'ODD_CELL', _zone, 8275, 5624, -1190),
               ('Б-10-10', 'EVEN_CELL', _zone, 9176, 5624, -1190),
               ('Б-10-11', 'ODD_CELL', _zone, 10185, 5624, -1190),
               ('Б-10-12', 'EVEN_CELL', _zone, 11081, 5624, -1190),
               ('Б-10-13', 'ODD_CELL', _zone, 12088, 5624, -1190),
               ('Б-10-14', 'EVEN_CELL', _zone, 12987, 5624, -1190),
               ('Б-11-1', 'ODD_CELL', _zone, 645, 6173, -1190),
               ('Б-11-2', 'EVEN_CELL', _zone, 1545, 6173, -1190),
               ('Б-11-3', 'ODD_CELL', _zone, 2549, 6173, -1190),
               ('Б-11-4', 'EVEN_CELL', _zone, 3439, 6173, -1190),
               ('Б-11-5', 'ODD_CELL', _zone, 4449, 6173, -1190),
               ('Б-11-6', 'EVEN_CELL', _zone, 5350, 6173, -1190),
               ('Б-11-7', 'ODD_CELL', _zone, 6364, 6173, -1190),
               ('Б-11-8', 'EVEN_CELL', _zone, 7263, 6173, -1190),
               ('Б-11-9', 'ODD_CELL', _zone, 8276, 6173, -1190),
               ('Б-11-10', 'EVEN_CELL', _zone, 9175, 6173, -1190),
               ('Б-11-11', 'ODD_CELL', _zone, 10187, 6173, -1190),
               ('Б-11-12', 'EVEN_CELL', _zone, 11082, 6173, -1190),
               ('Б-11-13', 'ODD_CELL', _zone, 12095, 6173, -1190),
               ('Б-11-14', 'EVEN_CELL', _zone, 12984, 6173, -1190),
               ('Б-12-1', 'ODD_CELL', _zone, 645, 6722, -1190),
               ('Б-12-2', 'EVEN_CELL', _zone, 1545, 6722, -1190),
               ('Б-12-3', 'ODD_CELL', _zone, 2548, 6722, -1190),
               ('Б-12-4', 'EVEN_CELL', _zone, 3438, 6722, -1190),
               ('Б-12-5', 'ODD_CELL', _zone, 4446, 6722, -1190),
               ('Б-12-6', 'EVEN_CELL', _zone, 5349, 6722, -1190),
               ('Б-12-7', 'ODD_CELL', _zone, 6363, 6722, -1190),
               ('Б-12-8', 'EVEN_CELL', _zone, 7262, 6722, -1190),
               ('Б-12-9', 'ODD_CELL', _zone, 8275, 6722, -1190),
               ('Б-12-10', 'EVEN_CELL', _zone, 9175, 6722, -1190),
               ('Б-12-11', 'ODD_CELL', _zone, 10186, 6722, -1190),
               ('Б-12-12', 'EVEN_CELL', _zone, 11080, 6722, -1190),
               ('Б-12-13', 'ODD_CELL', _zone, 12094, 6722, -1190),
               ('Б-12-14', 'EVEN_CELL', _zone, 12984, 6722, -1190),
               ('Б-13-1', 'ODD_CELL', _zone, 645, 7271, -1190),
               ('Б-13-2', 'EVEN_CELL', _zone, 1546, 7271, -1190),
               ('Б-13-3', 'ODD_CELL', _zone, 2548, 7271, -1190),
               ('Б-13-4', 'EVEN_CELL', _zone, 3437, 7271, -1190),
               ('Б-13-5', 'ODD_CELL', _zone, 4444, 7271, -1190),
               ('Б-13-6', 'EVEN_CELL', _zone, 5348, 7271, -1190),
               ('Б-13-7', 'ODD_CELL', _zone, 6363, 7271, -1190),
               ('Б-13-8', 'EVEN_CELL', _zone, 7260, 7271, -1190),
               ('Б-13-9', 'ODD_CELL', _zone, 8274, 7271, -1190),
               ('Б-13-10', 'EVEN_CELL', _zone, 9176, 7271, -1190),
               ('Б-13-11', 'ODD_CELL', _zone, 10185, 7271, -1190),
               ('Б-13-12', 'EVEN_CELL', _zone, 11079, 7271, -1190),
               ('Б-13-13', 'ODD_CELL', _zone, 12094, 7271, -1190),
               ('Б-13-14', 'EVEN_CELL', _zone, 12983, 7271, -1190),
               ('Б-14-1', 'ODD_CELL', _zone, 646, 7821, -1190),
               ('Б-14-2', 'EVEN_CELL', _zone, 1546, 7821, -1190),
               ('Б-14-3', 'ODD_CELL', _zone, 2548, 7821, -1190),
               ('Б-14-4', 'EVEN_CELL', _zone, 3437, 7821, -1190),
               ('Б-14-5', 'ODD_CELL', _zone, 4444, 7821, -1190),
               ('Б-14-6', 'EVEN_CELL', _zone, 5347, 7821, -1190),
               ('Б-14-7', 'ODD_CELL', _zone, 6362, 7821, -1190),
               ('Б-14-8', 'EVEN_CELL', _zone, 7264, 7821, -1190),
               ('Б-14-9', 'ODD_CELL', _zone, 8275, 7821, -1190),
               ('Б-14-10', 'EVEN_CELL', _zone, 9176, 7821, -1190),
               ('Б-14-11', 'ODD_CELL', _zone, 10184, 7821, -1190),
               ('Б-14-12', 'EVEN_CELL', _zone, 11080, 7821, -1190),
               ('Б-14-13', 'ODD_CELL', _zone, 12084, 7821, -1190),
               ('Б-14-14', 'EVEN_CELL', _zone, 12983, 7821, -1190),
               ('Б-15-1', 'ODD_CELL', _zone, 647, 8370, -1190),
               ('Б-15-2', 'EVEN_CELL', _zone, 1546, 8370, -1190),
               ('Б-15-3', 'ODD_CELL', _zone, 2548, 8370, -1190),
               ('Б-15-4', 'EVEN_CELL', _zone, 3437, 8370, -1190),
               ('Б-15-5', 'ODD_CELL', _zone, 4443, 8370, -1190),
               ('Б-15-6', 'EVEN_CELL', _zone, 5345, 8370, -1190),
               ('Б-15-7', 'ODD_CELL', _zone, 6361, 8370, -1190),
               ('Б-15-8', 'EVEN_CELL', _zone, 7260, 8370, -1190),
               ('Б-15-9', 'ODD_CELL', _zone, 8276, 8370, -1190),
               ('Б-15-10', 'EVEN_CELL', _zone, 9176, 8370, -1190),
               ('Б-15-11', 'ODD_CELL', _zone, 10187, 8370, -1190),
               ('Б-15-12', 'EVEN_CELL', _zone, 11079, 8370, -1190),
               ('Б-15-13', 'ODD_CELL', _zone, 12088, 8370, -1190),
               ('Б-15-14', 'EVEN_CELL', _zone, 12981, 8370, -1190);
    END;
$$ LANGUAGE plpgsql;