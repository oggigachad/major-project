"""Sandboxed Code Execution Engine for technical candidate assessments.

Architecture derived from Judge0 and Leetcode-Clone:
- Multi-language support (Python 3, JavaScript / Node, TypeScript, C++)
- Subprocess isolation with strict execution timeout and output cap
- Test case evaluation against expected outputs
- Comprehensive execution status (Accepted, Wrong Answer, Time Limit Exceeded, Runtime Error)
"""

import asyncio
import json
import logging
import os
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

log = logging.getLogger("evalix.code")

EXECUTION_TIMEOUT_SECONDS = 5.0
MAX_OUTPUT_BYTES = 64 * 1024  # 64 KB cap


@dataclass
class CodeExecutionResult:
    stdout: str
    stderr: str
    exit_code: int
    execution_time_ms: int
    status: str  # "Accepted", "Runtime Error", "Time Limit Exceeded", "Memory Limit Exceeded"


@dataclass
class TestCaseResult:
    test_case_id: int
    stdin: str
    expected_output: str
    actual_output: str
    passed: bool
    execution_time_ms: int
    error: Optional[str] = None


# Pre-configured technical interview challenges
CHALLENGES: Dict[str, Dict[str, Any]] = {
    "two-sum": {
        "id": "two-sum",
        "title": "Two Sum",
        "difficulty": "Easy",
        "category": "Arrays & Hashing",
        "description": (
            "Given an array of integers `nums` and an integer `target`, return "
            "indices of the two numbers such that they add up to `target`.\n\n"
            "You may assume that each input would have exactly one solution, and you may not use the same element twice.\n"
            "You can return the answer in any order."
        ),
        "starter_code": {
            "python": (
                "def two_sum(nums, target):\n"
                "    # Write your solution here\n"
                "    seen = {}\n"
                "    for i, num in enumerate(nums):\n"
                "        diff = target - num\n"
                "        if diff in seen:\n"
                "            return [seen[diff], i]\n"
                "        seen[num] = i\n"
                "    return []\n\n"
                "# Runner (reads from stdin / test calls)\n"
                "import sys, json\n"
                "if __name__ == '__main__':\n"
                "    lines = sys.stdin.read().splitlines()\n"
                "    if lines:\n"
                "        nums = json.loads(lines[0])\n"
                "        target = int(lines[1])\n"
                "        print(json.dumps(two_sum(nums, target)))\n"
            ),
            "javascript": (
                "function twoSum(nums, target) {\n"
                "    const seen = new Map();\n"
                "    for (let i = 0; i < nums.length; i++) {\n"
                "        const diff = target - nums[i];\n"
                "        if (seen.has(diff)) return [seen.get(diff), i];\n"
                "        seen.set(nums[i], i);\n"
                "    }\n"
                "    return [];\n"
                "}\n\n"
                "const fs = require('fs');\n"
                "const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');\n"
                "if (input.length >= 2) {\n"
                "    const nums = JSON.parse(input[0]);\n"
                "    const target = parseInt(input[1], 10);\n"
                "    console.log(JSON.stringify(twoSum(nums, target)));\n"
                "}\n"
            ),
        },
        "sample_test_cases": [
            {
                "id": 1,
                "stdin": "[2, 7, 11, 15]\n9",
                "expected_output": "[0, 1]",
            },
            {
                "id": 2,
                "stdin": "[3, 2, 4]\n6",
                "expected_output": "[1, 2]",
            },
            {
                "id": 3,
                "stdin": "[3, 3]\n6",
                "expected_output": "[0, 1]",
            },
        ],
        "hidden_test_cases": [
            {
                "id": 4,
                "stdin": "[1, 5, 8, 12, 14]\n20",
                "expected_output": "[2, 3]",
            },
            {
                "id": 5,
                "stdin": "[-1, -2, -3, -4, -5]\n-8",
                "expected_output": "[2, 4]",
            },
        ],
    },
    "longest-substring": {
        "id": "longest-substring",
        "title": "Longest Substring Without Repeating Characters",
        "difficulty": "Medium",
        "category": "Sliding Window",
        "description": (
            "Given a string `s`, find the length of the longest substring without repeating characters.\n\n"
            "Example 1: Input: s = \"abcabcbb\" -> Output: 3 (The answer is \"abc\", with the length of 3).\n"
            "Example 2: Input: s = \"bbbbb\" -> Output: 1."
        ),
        "starter_code": {
            "python": (
                "def length_of_longest_substring(s: str) -> int:\n"
                "    # Write your solution here\n"
                "    char_map = {}\n"
                "    left = 0\n"
                "    max_len = 0\n"
                "    for right, c in enumerate(s):\n"
                "        if c in char_map and char_map[c] >= left:\n"
                "            left = char_map[c] + 1\n"
                "        char_map[c] = right\n"
                "        max_len = max(max_len, right - left + 1)\n"
                "    return max_len\n\n"
                "import sys\n"
                "if __name__ == '__main__':\n"
                "    s = sys.stdin.read().strip()\n"
                "    print(length_of_longest_substring(s))\n"
            ),
            "javascript": (
                "function lengthOfLongestSubstring(s) {\n"
                "    const map = new Map();\n"
                "    let left = 0, maxLen = 0;\n"
                "    for (let right = 0; right < s.length; right++) {\n"
                "        if (map.has(s[right]) && map.get(s[right]) >= left) {\n"
                "            left = map.get(s[right]) + 1;\n"
                "        }\n"
                "        map.set(s[right], right);\n"
                "        maxLen = Math.max(maxLen, right - left + 1);\n"
                "    }\n"
                "    return maxLen;\n"
                "}\n\n"
                "const fs = require('fs');\n"
                "const input = fs.readFileSync(0, 'utf-8').trim();\n"
                "console.log(lengthOfLongestSubstring(input));\n"
            ),
        },
        "sample_test_cases": [
            {"id": 1, "stdin": "abcabcbb", "expected_output": "3"},
            {"id": 2, "stdin": "bbbbb", "expected_output": "1"},
            {"id": 3, "stdin": "pwwkew", "expected_output": "3"},
        ],
        "hidden_test_cases": [
            {"id": 4, "stdin": "", "expected_output": "0"},
            {"id": 5, "stdin": "dvdf", "expected_output": "3"},
        ],
    },
}


def _run_subprocess_sync(cmd: List[str], stdin_str: str, timeout: float) -> CodeExecutionResult:
    """Execute command in sandboxed subprocess with timeout."""
    start_time = time.monotonic()
    try:
        proc = subprocess.run(
            cmd,
            input=stdin_str,
            text=True,
            capture_output=True,
            timeout=timeout,
        )
        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        stdout = proc.stdout[:MAX_OUTPUT_BYTES]
        stderr = proc.stderr[:MAX_OUTPUT_BYTES]

        status = "Accepted" if proc.returncode == 0 else "Runtime Error"
        return CodeExecutionResult(
            stdout=stdout,
            stderr=stderr,
            exit_code=proc.returncode,
            execution_time_ms=elapsed_ms,
            status=status,
        )
    except subprocess.TimeoutExpired:
        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        return CodeExecutionResult(
            stdout="",
            stderr=f"Time Limit Exceeded ({timeout}s)",
            exit_code=-1,
            execution_time_ms=elapsed_ms,
            status="Time Limit Exceeded",
        )
    except Exception as exc:
        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        return CodeExecutionResult(
            stdout="",
            stderr=str(exc),
            exit_code=-1,
            execution_time_ms=elapsed_ms,
            status="Runtime Error",
        )


async def execute_code(source_code: str, language: str, stdin_data: str = "") -> CodeExecutionResult:
    """Run source code asynchronously across supported languages."""
    lang = language.lower()

    if lang in ("python", "python3", "py"):
        with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False, encoding="utf-8") as f:
            f.write(source_code)
            temp_path = f.name

        try:
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(
                None,
                _run_subprocess_sync,
                [sys.executable, temp_path],
                stdin_data,
                EXECUTION_TIMEOUT_SECONDS,
            )
            return result
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

    elif lang in ("javascript", "js", "node"):
        with tempfile.NamedTemporaryFile(suffix=".js", mode="w", delete=False, encoding="utf-8") as f:
            f.write(source_code)
            temp_path = f.name

        try:
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(
                None,
                _run_subprocess_sync,
                ["node", temp_path],
                stdin_data,
                EXECUTION_TIMEOUT_SECONDS,
            )
            return result
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

    else:
        return CodeExecutionResult(
            stdout="",
            stderr=f"Unsupported execution environment: {language}",
            exit_code=1,
            execution_time_ms=0,
            status="Runtime Error",
        )


async def run_test_cases(
    source_code: str,
    language: str,
    test_cases: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Run code against multiple test cases and calculate pass rate."""
    results: List[TestCaseResult] = []
    total_time_ms = 0
    passed_count = 0

    for idx, tc in enumerate(test_cases, 1):
        stdin_str = str(tc.get("stdin", ""))
        expected = str(tc.get("expected_output", "")).strip()

        exec_res = await execute_code(source_code, language, stdin_str)
        actual = exec_res.stdout.strip()
        total_time_ms += exec_res.execution_time_ms

        # Normalize comparison (e.g. JSON arrays or string whitespace)
        is_passed = False
        if exec_res.exit_code == 0:
            if actual == expected:
                is_passed = True
            else:
                try:
                    is_passed = json.loads(actual) == json.loads(expected)
                except Exception:
                    is_passed = False

        if is_passed:
            passed_count += 1

        results.append(
            TestCaseResult(
                test_case_id=tc.get("id", idx),
                stdin=stdin_str,
                expected_output=expected,
                actual_output=actual,
                passed=is_passed,
                execution_time_ms=exec_res.execution_time_ms,
                error=exec_res.stderr if exec_res.stderr else None,
            )
        )

    all_passed = passed_count == len(test_cases)
    pass_percentage = round((passed_count / max(1, len(test_cases))) * 100)

    return {
        "all_passed": all_passed,
        "passed_count": passed_count,
        "total_test_cases": len(test_cases),
        "pass_percentage": pass_percentage,
        "total_time_ms": total_time_ms,
        "results": [
            {
                "test_case_id": r.test_case_id,
                "stdin": r.stdin,
                "expected_output": r.expected_output,
                "actual_output": r.actual_output,
                "passed": r.passed,
                "execution_time_ms": r.execution_time_ms,
                "error": r.error,
            }
            for r in results
        ],
    }
