
var from,
	range,
	text,
	button;

// functions
function copyToClipboard() {
	from = document.getElementById("script");
	range = document.createRange();
	window.getSelection().removeAllRanges();
	range.selectNode(from);
	window.getSelection().addRange(range);
	document.execCommand('copy');
	window.getSelection().removeAllRanges();
}

function showText(scr) {
	text = "";
	document.getElementById("script").innerHTML = scr;
	for (let i = 0; i < myObj[scr].length; i++) {
		text += myObj[scr][i] + "<br>";
	}
	document.getElementById("script").innerHTML = text;
	copyToClipboard();
}

// end functions


// data

var myObj = {

	"defs": [
		"COLUMN owner                FORMAT a24",
		"COLUMN member               FORMAT a60",
		"COLUMN grantee              FORMAT a14",
		"COLUMN filename             FORMAT a64",
		"COLUMN file_name            FORMAT a64",
		"COLUMN profile              FORMAT a16",
		"COLUMN name                 FORMAT a60",
		"COLUMN username             FORMAT a32",
		"COLUMN object_name          FORMAT a50",
		"COLUMN tablespace_name      FORMAT a24",
		"COLUMN \"Tablespace Name\"    FORMAT a24",
		"COLUMN default_tablespace   FORMAT a24",
		"COLUMN host                 FORMAT a30",
		"COLUMN db_link              FORMAT a30",
		"COLUMN directory_path       FORMAT a56",
		"COLUMN directory_name       FORMAT a24",
		"COLUMN object_path          FORMAT a48",
		"COLUMN comments             FORMAT a96",
		"COLUMN account_status       FORMAT a17",
		"SET    pagesize                    250",
		"SET    linesize                    196",
		"SET    timing               ON"        ,
		"SET    time                 ON"        ,
		"SET    verify               OFF"       ,
		"SET    history              200"
	],
	
	"tbs": [
		"CLEAR break",
		"CLEAR comp",
		"BREAK ON report",
		"COMPUTE SUM LABEL 'Total MB' OF 'Actual size' 'Used space'  'Max size'  'Real Free' ON report",
		"WITH",
		"    free_sp AS (",
		"        SELECT tbs.tablespace_name,DECODE (SUM(fs.bytes/1024/1024),NULL,0,SUM(fs.bytes/1024/1024)) free_space",
		"        FROM sys.dba_tablespaces tbs, sys.dba_free_space fs",
		"        WHERE tbs.tablespace_name=fs.tablespace_name(+)",
		"        GROUP BY tbs.tablespace_name",
		"        ) ,",
		"    total_sp AS (",
		"        SELECT tablespace_name, SUM(bytes/1024/1024) total_space,",
		"        SUM(DECODE(autoextensible,'YES',DECODE(SIGN(maxbytes-bytes),-1,0,(maxbytes-bytes)/1024/1024),0)) maxbytes",
		"        FROM dba_data_files",
		"        GROUP BY tablespace_name",
		"        )",
		"SELECT",
		"    total.tablespace_name \"Tablespace Name\",",
		"    ROUND(total_space) \"Actual size\",",
		"    ROUND((total_space-free_space)) \"Used space\",",
		"    ROUND(total_space+total.maxbytes) \"Max size\",",
		"    ROUND((total_space+total.maxbytes)-(total_space-free_space)) \"Real Free\",",
		"    ROUND( 100* ((total_space-free_space)/(total_space+total.maxbytes))) \"Used %\"",
		"FROM free_sp free, total_sp total",
		"WHERE free.tablespace_name = total.tablespace_name",
		"ORDER BY \"Used %\";"
	],
	
	"dFiles": [
		"SELECT d.tablespace_name",
		", d.file_id",
		", d.file_name",
		", d.bytes/1024/1024 AS mb",
		", d.maxbytes/1024/1024 AS maxmb",
		", d.increment_by/1024*(SELECT t.block_size/1024 FROM",
		"dba_tablespaces t WHERE t.tablespace_name=d.tablespace_name) AS incr_mb",
		"FROM dba_data_files d",
		"WHERE d.tablespace_name = upper('&tspace')",
		"ORDER by d.file_name;"
	],
	
	"addDatafile": [
		"alter tablespace &tspace add datafile ;"
	],
	
	"tFiles": [
		"SELECT d.tablespace_name",
		", d.file_id",
		", d.file_name",
		", d.bytes/1024/1024 AS mb",
		", d.maxbytes/1024/1024 AS maxmb",
		", d.increment_by/1024*(SELECT t.block_size/1024 FROM",
		"dba_tablespaces t WHERE t.tablespace_name=d.tablespace_name) AS incr_mb",
		"FROM dba_temp_files d",
		"WHERE d.tablespace_name in (",
		"	SELECT tablespace_name FROM dba_tablespaces",
		"	WHERE contents = 'TEMPORARY'",
		"	)",
		"ORDER by d.tablespace_name , d.file_name;"
	],
	
	"blocking1": [
		"select    inst_id,",
		"          blocking_session,",
		"          sid,",
		"          serial#,",
		"          program,",
		"          event,",
		"          wait_class,",
		"          seconds_in_wait",
		"from      gv$session",
		"where     blocking_session is not NULL",
		"order by  blocking_session;"
	],
	
	"blocking2": [
		"select    l1.sid,",
		"          ' IS BLOCKING ',",
		"          l2.sid",
		"from      gv$lock l1,", 
		"          gv$lock l2",
		"where     l1.block =1",
		"          and l2.request > 0",
		"          and l1.id1=l2.id1",
		"          and l1.id2=l2.id2;"
	],
	
	"sessionWait": [
		"column event    format a32",
		"column p1text   format a12",
		"column p2text   format a10",
		"column p3text   format a10",
		"select    sid, event, p1text, p2text, p3text, wait_time, seconds_in_wait, state",
		"from      v$session_wait",
		"where     lower(event) not in ('sql*net message from client','rdbms ipc message','pmon timer','smon timer')",
		"          and lower(event) not like '%idle wait%'",
		"          and event not like 'streams aq%'",
		"order by  seconds_in_wait asc ;"
	],
	
	"privs": [
		"SELECT grantee , privilege    AS \"priv/role\" , admin_option FROM dba_sys_privs  WHERE grantee = UPPER('&grantee')",
		"UNION",
		"SELECT grantee , granted_role AS \"priv/role\" , admin_option FROM dba_role_privs WHERE grantee = UPPER('&grantee')",
		"ORDER BY 1 , 2 ;"
	],
	
	"users": [
		"select    username, default_tablespace, profile, created, lock_date, expiry_date, account_status",
		"from      dba_users",
		"order by  created asc;"
	],
	
	
	"user": [
		"select   username , created , profile , lock_date , expiry_date, default_tablespace",
		"from     dba_users ",
		"where    username=upper('&1');"
	],
	
	"saveCrontab": [
		"crontab -l > crontab_`date +'%Y%m%d_%H%M%S'`"
	],
	
	"cronDate": [
		"date +'%M %H %d %m * (sec: %S)'"
	],
	
	"PS1oraenv": [
		"export PS1='[\\u@\\h [${ORACLE_SID}] \\W \\t]\\$ '",
		"egrep \"^[A-Z]|^\\+\" /etc/oratab | awk -F: \'{print $1}\' | sort; read -p \"SID: \" dbname; . oraenv<<<\"${dbname}\"; echo \"\""
	],
	
	"NLSdate": [
		"ALTER SESSION SET nls_date_format='YYYY-MM-DD HH24:MI:SS' ;"
	],
	
	"PLAN": [
		"SET lines 5000 pages 300",
		"SELECT * FROM TABLE(dbms_xplan.display_cursor('&SQL_ID'));"
	],
	
	"alertlog": [
		"re='^[0-9]+$'",
		"[[ ${ORACLE_SID: -1} =~ ${re} ]] && dbname=`echo ${ORACLE_SID: : -1}` || dbname=${ORACLE_SID} ; dbname=$(echo ${dbname} | tr '[:upper:]' '[:lower:]')",
		"less /orasw/app/oracle/diag/rdbms/${dbname}/${ORACLE_SID}/trace/alert_${ORACLE_SID}.log"
	],
	
	"tabColWidth": [
		"select 'col '||column_name||' for a&colWidth' from dba_tab_columns where table_name=upper('&tabName');"
	],
	
	"dirs": [
		"select * from dba_directories order by directory_path;"
	],
	
	"getDDL": [
		"set long 1000000",
		"set trimspool on",
		"set feedback off",
		"set verify off",
		"set pagesize 1000",
		"set linesize 1000",
		"set longchunksize 10000",
		"col \"Source\" format a160",
		"execute dbms_metadata.set_transform_param(dbms_metadata.session_transform,'SQLTERMINATOR',true);",
		"execute dbms_metadata.set_transform_param(dbms_metadata.session_transform,'STORAGE',false);",
		"select dbms_metadata.get_ddl (upper('&obj_type'),upper('&obj_name'),upper('&owner')) from dual ;"
	],
	
	"SQLtrace": [
		"exec dbms_system.set_ev( &SID, &SERIAL, 10046, 12, '');"
	],
	
	"SQLuntrace": [
		"exec dbms_system.set_ev( &SID, &SERIAL, 10046, 0, '');"
	],
	
	"DBstatus": [
		"col name          for a14",
		"col database_role for a18",
		"col log_mode      for a14",
		"col open_mode     for a14",
		"col guard_status  for a14",
		"col force_logging for a14",
		"set linesize          232",
		"select d.name , d.db_unique_name , d.database_role , d.log_mode , i.parallel , d.open_mode , d.guard_status , d.force_logging from v$database d, v$instance i ;"
	],
	
	"RP": [
		"SET PAGESIZE 60",
		"SET LINESIZE 300",
		"SET VERIFY OFF",
		"COLUMN scn FOR 999999999999999",
		"COLUMN Incarn FOR 99",
		"COLUMN name FOR A25", 
		"COLUMN storage_size FOR 999999999999", 
		"COLUMN guarantee_flashback_database FOR A3", 
		"SELECT     database_incarnation# as Incarn",
		"          ,scn",
		"          ,name",
		"          ,to_char(time,'YYYY-MM-DD HH24:MI:SS') as time",
		"          ,storage_size",
		"          ,guarantee_flashback_database",
		"FROM      v$restore_point",
		"ORDER BY  time",
		";"
	],
	
	"context": [
		"col session_user   for a16",
		"col session_schema for a16",
		"col current_schema for a16",
		"col proxy_id       for a16",
		"col user           for a16",
		"select 	sys_context('USERENV','SESSION_USER') 	as session_user,",
		"		sys_context('USERENV','SESSION_SCHEMA') as session_schema,",
		"		sys_context('USERENV','CURRENT_SCHEMA') as current_schema,",
		"		sys_context('USERENV','PROXY_USER') 	as proxy_id,",
		"		user",
		"from dual;"
	],
	
	"instances": [
		"ps -ef | grep -vE \"sed|awk|grep|\\+ASM|\\-MGMTDB|\\+APX\" | grep pmon | awk '{print $NF}' | sed 's/ora_pmon_//' | sort"
	],

	"redoMap": [
		"set pages 999 lines 400",
		"col h0 format 999",
		"col h1 format 999",
		"col h2 format 999",
		"col h3 format 999",
		"col h4 format 999",
		"col h5 format 999",
		"col h6 format 999",
		"col h7 format 999",
		"col h8 format 999",
		"col h9 format 999",
		"col h10 format 999",
		"col h11 format 999",
		"col h12 format 999",
		"col h13 format 999",
		"col h14 format 999",
		"col h15 format 999",
		"col h16 format 999",
		"col h17 format 999",
		"col h18 format 999",
		"col h19 format 999",
		"col h20 format 999",
		"col h21 format 999",
		"col h22 format 999",
		"col h23 format 999",
		"alter session set nls_date_format='YYYY-MON-DD' ;",
		"SELECT TRUNC (first_time) \"Date\", inst_id, TO_CHAR (first_time, 'Dy') \"Day\",",
		"  COUNT (1) \"Total\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '00', 1, 0)) \"h0\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '01', 1, 0)) \"h1\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '02', 1, 0)) \"h2\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '03', 1, 0)) \"h3\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '04', 1, 0)) \"h4\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '05', 1, 0)) \"h5\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '06', 1, 0)) \"h6\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '07', 1, 0)) \"h7\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '08', 1, 0)) \"h8\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '09', 1, 0)) \"h9\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '10', 1, 0)) \"h10\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '11', 1, 0)) \"h11\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '12', 1, 0)) \"h12\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '13', 1, 0)) \"h13\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '14', 1, 0)) \"h14\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '15', 1, 0)) \"h15\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '16', 1, 0)) \"h16\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '17', 1, 0)) \"h17\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '18', 1, 0)) \"h18\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '19', 1, 0)) \"h19\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '20', 1, 0)) \"h20\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '21', 1, 0)) \"h21\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '22', 1, 0)) \"h22\",",
		"  SUM (DECODE (TO_CHAR (first_time, 'hh24'), '23', 1, 0)) \"h23\",",
		"  ROUND (COUNT (1) / 24, 2) \"Avg\"",
		"FROM gv$log_history",
		"WHERE thread# = inst_id",
		"AND first_time > sysdate -8",
		"GROUP BY TRUNC (first_time), inst_id, TO_CHAR (first_time, 'Dy')",
		"ORDER BY 1,2;"
	],

	"recoUsage": [
		"SELECT * FROM v\$recovery_area_usage ;"
	],

	"blk#2segName": [
		"col owner for a10",
		"col segment_name for a15",
		"col partition_name for a15",
		"col segment_type for a10",
		"col file_id for 999",
		"select owner,segment_name,partition_name,segment_type,file_id,block_id",
		"from dba_extents",
		"where &block_number between block_id and block_id + blocks - 1",
			"and file_id=&file_id;"
	],

	"asmDG": [
		"select group_number , name, state , total_mb , free_mb from v$asm_diskgroup ;"
	],

	"asmDISK": [
		"col name for  a24",
		"col grp  for 9999",
		"col dnum for 9999",
		"col path for  a32",
		"select label , name , path , os_mb , total_mb , free_mb , group_number as grp , disk_number as dnum , mount_status , header_status , mode_status , state",
		"from v$asm_disk order by grp , name;"
	]
}


for (var key in myObj) {
	button = "<button class=\"btn\" onclick=\"showText('" + key + "')\">" + key + "</button>"
	document.getElementById("buttons").innerHTML += button;
}

// end data
